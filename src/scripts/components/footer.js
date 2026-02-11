import { translateDom } from '../i18n.js';

export function renderFooter() {
  const footer = document.querySelector('#site-footer');
  if (!footer) {
    return;
  }

  footer.innerHTML = `
    <div class="footer" role="contentinfo">
      <div class="footer__inner">
        <div class="footer__top">
          <strong class="footer__bismillah" data-i18n="common:bismillah"></strong>
          <ul class="footer__links" aria-label="Footer Links">
            <li><a href="#" data-i18n="common:footer.about"></a></li>
            <li><a href="#" data-i18n="common:footer.contact"></a></li>
            <li><a href="#" data-i18n="common:footer.shipping"></a></li>
            <li><a href="#" data-i18n="common:footer.privacy"></a></li>
          </ul>
        </div>
        <p class="footer__bottom">© <span id="footer-year"></span> <span data-i18n="common:footer.copyright"></span></p>
      </div>
    </div>
  `;

  const year = footer.querySelector('#footer-year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  translateDom(footer);
}
