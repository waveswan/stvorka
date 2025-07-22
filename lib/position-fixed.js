import {isIOS} from "./browser";

let previousBodyPosition = null;
let scrollY = 0;

export const usePositionFixed = () => {
  return {
    setPositionFixed() {
      if (typeof document === 'undefined') return;

      scrollY = window.scrollY;

      previousBodyPosition = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        height: document.body.style.height,
        width: document.body.style.width,
        overflow: document.body.style.overflow
      };

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.height = '100%';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    },

    restorePositionSetting() {
      if (!previousBodyPosition) return;

      document.body.style.position = previousBodyPosition.position;
      document.body.style.top = previousBodyPosition.top;
      document.body.style.left = previousBodyPosition.left;
      document.body.style.height = previousBodyPosition.height;
      document.body.style.width = previousBodyPosition.width;
      document.body.style.overflow = previousBodyPosition.overflow;

      window.scrollTo(0, scrollY);
      previousBodyPosition = null;

      // Форсируем рефлоу для iOS
      if (isIOS()) {
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
          document.body.style.overflow = previousBodyPosition?.overflow || '';
        }, 50);
      }
    }
  };
};