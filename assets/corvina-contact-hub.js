(function () {
  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-cch-scroll]');
    if (!link) return;
    var targetId = link.getAttribute('href');
    if (!targetId || targetId.charAt(0) !== '#') return;
    var target = document.querySelector(targetId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
