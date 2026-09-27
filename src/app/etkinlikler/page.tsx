'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Music, Clock, Calendar, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { StageEvent, STAGE_EVENTS as FALLBACK_EVENTS } from '@/data/eventsData';
import { getNextEventDate } from '@/lib/dateUtils';

export default function EventsPage() {
  const [events, setEvents] = useState<StageEvent[]>(FALLBACK_EVENTS);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEvents(json.data);
        }
      })
      .catch(err => console.error('Events fetch error:', err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-14">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
          <Music className="w-3.5 h-3.5" />
          <span>Canlı Müzik &amp; Fasıl Kültürü</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">
          HayalMest Sahne Programı
        </h1>
        <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
          Usta saz sanatçıları, kanun, ud, keman ve ritim eşliğinde Türk Sanat Müziği’nin ve 90’lar klasiklerinin en güzel şarkılarıyla buluşun.
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-8">
        {events.map((event) => (
          <div
            key={event.id}
            className="luxury-card rounded-3xl overflow-hidden border border-meyhane-border/70 hover:border-gold/40 transition-all grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8"
          >
            {/* Image (5 cols) */}
            <div className="lg:col-span-5 relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden">
              <Image
                src={event.image || '/assets/Hayalmest-sahne.jpg'}
                alt={event.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-gold text-black text-xs font-bold uppercase tracking-wider">
                  {event.genreLabel}
                </span>
                {event.badge && (
                  <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-gold text-xs font-semibold border border-gold/40">
                    {event.badge}
                  </span>
                )}
              </div>
              <div className="absolute bottom-4 left-4 text-xs font-medium text-white/90 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm">
                {event.day}
              </div>
            </div>

            {/* Details (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs text-meyhane-muted">
                  <span className="flex items-center gap-1.5 text-gold font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.day}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    {event.time}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  {event.title}
                </h2>
                <div className="text-sm font-semibold text-gold-300">
                  {event.performer}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
                {event.description}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                  <span>Akustik Masa Yanı Fasıl</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                  <span>Doğum Günü Kutlamaları</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                  <span>İstek Parça İletme</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                  <span>Özel Sahne Önü Masalar</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                {(() => {
                  const targetDate = getNextEventDate(event);
                  return (
                    <Link
                      href={`/rezervasyon?event=${event.id}&date=${targetDate}`}
                      className="px-6 py-3 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/20 flex items-center gap-2"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      <span>Bu Geceye Rezervasyon Yap ({targetDate})</span>
                    </Link>
                  );
                })()}
                <a
                  href={`https://wa.me/905305012458?text=Merhaba,%20${encodeURIComponent(event.title)}%20etkinli%C4%9Fi%20hakk%C4%B1nda%20bilgi%20ve%20masa%20ay%C4%B1rtmak%20istiyorum.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-meyhane-border text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  WhatsApp Bilgi Hattı
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
