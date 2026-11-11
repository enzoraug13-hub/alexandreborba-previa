(function () {
  var WHATSAPP = '5551999481717';
  // Webhook do Make: recebe cada lead do formulário antes de abrir o WhatsApp.
  var WEBHOOK_URL = 'https://hook.us2.make.com/an4krchp1ohrq2w8xfeynse1fmjje9bm';

  window.dataLayer = window.dataLayer || [];

  // Menu no celular
  var menuBtn = document.getElementById('menu-btn');
  var mnav = document.getElementById('mnav');
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () {
      var on = mnav.classList.toggle('on');
      menuBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }

  // Popup de agendamento: todo elemento com data-agendar abre o formulário
  var modal = document.getElementById('agendar');
  var form = document.getElementById('form-agendar');
  var tel = document.getElementById('telefone');
  var done = document.getElementById('form-ok');

  function openModal(trigger) {
    if (!modal || typeof modal.showModal !== 'function') return false;
    var motivo = trigger && trigger.getAttribute('data-motivo');
    if (motivo) {
      for (var i = 0; i < form.motivo.options.length; i++) {
        if (form.motivo.options[i].text === motivo) form.motivo.selectedIndex = i;
      }
    }
    done.classList.remove('on');
    if (mnav) mnav.classList.remove('on');
    modal.showModal();
    form.nome.focus();
    window.dataLayer.push({ event: 'abrir_agendamento', origem: (trigger && trigger.getAttribute('data-origem')) || '' });
    return true;
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-agendar]');
    if (t && openModal(t)) e.preventDefault();
  });

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('[data-fechar]')) modal.close();
    });
  }

  // Link direto para o formulário: qualquer página com #agendar no endereço já abre o popup
  if (location.hash === '#agendar') openModal(null);

  if (tel) {
    tel.addEventListener('input', function () {
      var d = tel.value.replace(/\D/g, '').slice(0, 11);
      var out = d;
      if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 6) {
        var cut = d.length === 11 ? 7 : 6;
        out = '(' + d.slice(0, 2) + ') ' + d.slice(2, cut) + '-' + d.slice(cut);
      }
      tel.value = out;
    });
  }

  function check(el, ok) {
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.nome, motivo = form.motivo;
      var digits = tel.value.replace(/\D/g, '');
      var okNome = check(nome, nome.value.trim().length >= 2);
      var okTel = check(tel, digits.length === 10 || digits.length === 11);
      var okMotivo = check(motivo, motivo.value !== '');
      if (!okNome) { nome.focus(); return; }
      if (!okTel) { tel.focus(); return; }
      if (!okMotivo) { motivo.focus(); return; }

      var lead = {
        nome: nome.value.trim(),
        telefone: tel.value,
        telefone_digitos: '55' + digits,
        motivo: motivo.value,
        ressonancia: form.exame.value,
        local: form.local.value,
        pagina: location.pathname,
        utm: location.search.replace(/^\?/, ''),
        data: new Date().toISOString()
      };

      var msg = 'Olá! Gostaria de agendar uma consulta com o Dr. Alexandre Borba.\n\n' +
        'Nome: ' + lead.nome + '\n' +
        'Telefone: ' + lead.telefone + '\n' +
        'Motivo: ' + lead.motivo + '\n' +
        'Já fiz ressonância: ' + lead.ressonancia + '\n' +
        'Local de preferência: ' + lead.local;
      var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);

      window.dataLayer.push({ event: 'lead_agendamento', motivo: lead.motivo, local: lead.local });

      if (WEBHOOK_URL && !window.SITE_DEMO) {
        // Formulário codificado (sem preflight de CORS). sendBeacon garante o envio mesmo com a troca para o WhatsApp.
        try {
          var body = new URLSearchParams(lead);
          if (!(navigator.sendBeacon && navigator.sendBeacon(WEBHOOK_URL, body))) {
            fetch(WEBHOOK_URL, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }).catch(function () {});
          }
        } catch (err) {}
      }

      document.getElementById('form-link').href = url;
      done.classList.add('on');
      window.open(url, '_blank', 'noopener');
    });

    ['nome', 'telefone', 'motivo'].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); });
      el.addEventListener('change', function () { el.removeAttribute('aria-invalid'); });
    });
  }

  // Mapa da coluna: abas e regiões do desenho
  var tabs = document.querySelectorAll('[data-reg-tab]');
  function showRegion(reg) {
    tabs.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-reg-tab') === reg ? 'true' : 'false'); });
    document.querySelectorAll('[data-reg-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-reg-panel') !== reg; });
    document.querySelectorAll('[data-reg]').forEach(function (g) { g.classList.toggle('on', g.getAttribute('data-reg') === reg); });
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { showRegion(b.getAttribute('data-reg-tab')); }); });
  document.querySelectorAll('[data-reg]').forEach(function (g) {
    g.addEventListener('click', function () { showRegion(g.getAttribute('data-reg')); });
  });
})();

// Entrevista do YouTube: só carrega o player quando a pessoa clica
document.querySelectorAll('[data-yt]').forEach(function (b) {
  b.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0';
    f.title = b.getAttribute('aria-label');
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    f.className = 'yt-frame';
    b.replaceWith(f);
  });
});
