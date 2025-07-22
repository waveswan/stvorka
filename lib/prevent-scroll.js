import {isIOS} from "./browser";

export const preventScroll = {
  enable() {
    if (typeof document === 'undefined') return;

    if(isIOS()){
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // Добавляем временный padding-bottom для компенсации скролла
      document.body.style.paddingBottom = '1px';
      setTimeout(() => {
        document.body.style.paddingBottom = '';
      }, 100);
    } else {
      document.body.style.overflow = 'hidden';
    }
  },

  disable() {
    if (typeof document === 'undefined') return;

    if(isIOS()){
      const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      // Форсируем рефлоу
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 20);
    } else {
      document.body.style.overflow = '';
    }
  }
};