'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'Rezervasyon ve Bilgi',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5" />
          <span>Bize Ulaşın</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">
          İletişim &amp; Rezervasyon Bilgileri
        </h1>
        <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
          Özel davetleriniz, grup kutlamalarınız veya aklınıza takılan her türlü soru için ekibimizle dilediğiniz an iletişime geçebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Contact Info Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="luxury-card p-6 rounded-3xl border border-meyhane-border/70 space-y-5">
            <h2 className="text-xl font-bold font-serif text-white border-b border-meyhane-border/70 pb-3">
              Mekan Bilgileri
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-meyhane-muted uppercase tracking-wider">Açık Adres</div>
                  <div className="text-white font-medium mt-0.5 leading-relaxed text-xs sm:text-sm">
                    Altıntepe Mahallesi, Kasaplar Çarşısı, Altıntepe, Bağdat Cad. No:4, 34840 Maltepe / İstanbul
                  </div>
                  <div className="text-[11px] text-gold mt-1">Bostancı sınırında, Marmaray’a yürüme mesafesinde</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-meyhane-muted uppercase tracking-wider">Rezervasyon &amp; Danışma</div>
                  <a href="tel:05305012458" className="text-white hover:text-gold font-semibold text-base block mt-0.5">
                    0530 501 24 58
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-meyhane-muted uppercase tracking-wider">E-posta</div>
                  <a href="mailto:rezervasyon@hayalmest.com" className="text-gray-300 hover:text-gold text-xs sm:text-sm block mt-0.5">
                    rezervasyon@hayalmest.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-meyhane-muted uppercase tracking-wider">Çalışma Saatleri</div>
                  <div className="text-white font-medium text-xs sm:text-sm mt-0.5">
                    Haftanın 7 Günü: 16:00 - 02:00
                  </div>
                  <div className="text-[11px] text-gray-400">Canlı Fasıl: 20:30 - 00:30</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Action Box */}
          <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <MessageCircle className="w-4 h-4" />
              WhatsApp Hızlı Destek
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Rezervasyon teyidi, organizasyon fiyat teklifi veya özel masa talepleriniz için WhatsApp üzerinden 7/24 mesaj bırakabilirsiniz.
            </p>
            <a
              href="https://wa.me/905305012458?text=Merhaba,%20HayalMest%20rezervasyon%20hakk%C4%B1nda%20yaz%C4%B1yorum."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Sohbeti Başlat</span>
            </a>
          </div>

        </div>

        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="luxury-card p-6 sm:p-10 rounded-3xl border border-meyhane-border/70">
            <h2 className="text-2xl font-bold font-serif text-white mb-2">
              Bize Mesaj Gönderin
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Organizasyon, menü veya genel sorularınız için aşağıdaki formu doldurabilirsiniz. Ekibimiz en kısa sürede dönüş yapacaktır.
            </p>

            {formSent ? (
              <div className="py-12 text-center space-y-3 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-serif text-white">Mesajınız Alındı!</h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Talebiniz ekibimize iletilmiştir. Belirttiğiniz telefon numarasından en kısa sürede sizinle iletişime geçeceğiz.
                </p>
                <button
                  type="button"
                  onClick={() => setFormSent(false)}
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gold text-xs font-semibold uppercase tracking-wider"
                >
                  Yeni Mesaj Gönder
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-medium">Adınız ve Soyadınız *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ad Soyad"
                      className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-xs sm:text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-medium">Telefon Numaranız *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05xx xxx xx xx"
                      className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-xs sm:text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-300 font-medium">Konu</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-xs sm:text-sm focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="Rezervasyon ve Bilgi">Masa Rezervasyonu ve Bilgi</option>
                    <option value="Doğum Günü & Bekarlığa Veda">Doğum Günü / Bekarlığa Veda Partisi</option>
                    <option value="Şirket & Kurumsal Yemek">Şirket / Kurumsal Yemek Teklifi</option>
                    <option value="Canlı Müzik Programı">Canlı Müzik / Sanatçı Programı</option>
                    <option value="Diğer Konu">Diğer Konular</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-300 font-medium">Mesajınız *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Talebinizi, kişi sayısını veya sormak istediğiniz detayları belirtiniz..."
                    className="w-full bg-meyhane-bg border border-meyhane-border px-4 py-3 rounded-xl text-white text-xs sm:text-sm focus:border-gold focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg shadow-gold/25 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Mesajı Gönder</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* Embedded Google Map */}
      <div className="rounded-3xl overflow-hidden border border-meyhane-border shadow-2xl h-80 sm:h-96 relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3013.3444458319694!2d29.0945863!3d40.9515904!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac6420556157f%3A0x86619bf188f57297!2sAlt%C4%B1ntepe%2C%20Ba%C4%9Fdat%20Cd.%20No%3A4%2C%2034840%20Maltepe%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1710000000000!5m2!1str!2str"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="grayscale-[20%] contrast-[1.1]"
          title="HayalMest Harita"
        />
      </div>

    </div>
  );
}
