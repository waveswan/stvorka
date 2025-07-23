import {Template} from 'meteor/templating';
import {Meteor} from 'meteor/meteor';
import {ReactiveVar} from 'meteor/reactive-var';
import {preventScroll} from '../lib/prevent-scroll';
import {usePositionFixed} from '../lib/position-fixed';
import {isIOS} from '../lib/browser';

import './stvorka.html'

// Константы для управления поведением BottomSheet
const DRAG_CLOSE_THRESHOLD = 100;
const DRAG_VELOCITY_THRESHOLD = 0.3;

/* Debounce (дебаунс) — это техника в программировании, которая откладывает выполнение функции до тех пор, пока не
* пройдет определенное время без новых вызовов этой функции. Это особенно полезно для обработки частых событий
* (например, скролла, изменения размера окна или drag-событий), чтобы избежать излишней нагрузки на браузер. */
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

// Хранилище активных экземпляров
const activeInstances = new Map();
// Счетчик экземпляров для уникальных идентификаторов
let instanceCounter = 0;

// Создаем класс для управления состоянием BottomSheet
class StvorkaBottomSheetManager {
    constructor(templateInstance) {
        this.id = templateInstance.data.id; // Используем переданный ID

        // Регистрация в глобальном хранилище
        if (!activeInstances.has(this.id)) {
            activeInstances.set(this.id, this);
        } else {
            console.warn(`StvorkaBottomSheetManager with id "${this.id}" already exists!`);
            return activeInstances.get(this.id);
        }

        this.instance = templateInstance;
        this.isOpen = new ReactiveVar(false);
        this.isDragging = new ReactiveVar(false);
        this.transform = new ReactiveVar('');
        this.height = new ReactiveVar('');
        this.keyboardIsOpen = new ReactiveVar(false);
        this.hasBeenOpened = new ReactiveVar(false);
        this.positionFixed = usePositionFixed();

    }

    destroy() {
        // Удаляем экземпляр при уничтожении
        console.log('Destroying StvorkaBottomSheetManager with id:', this.id);
        activeInstances.delete(this.id);
        if (this.instance) {
            this.instance.manager = null;
            this.instance = null;
        }
        if (this._keyboardResizeHandler) {
            window.visualViewport?.removeEventListener('resize', this._keyboardResizeHandler);
        }
    }

    open() {
        this.isOpen.set(true);
        this.hasBeenOpened.set(true);
        this.positionFixed.setPositionFixed();
        preventScroll.enable();
        this.transform.set('translateY(0)');
        this.bringToFront();
    }

    // Пересчтваем z-индекс, чтобы этот BottomSheet был поверх остальных
    bringToFront() {
        const allSheets = Template.StvorkaBottomSheet.getAll();
        const maxZIndex = allSheets.length ? Math.max(...allSheets.map(s => s.zIndex || 0)) : 0;
        this.zIndex = maxZIndex + 1050;
        this.instance.$('.stvorka-sheet').css('z-index', this.zIndex);
    }

    close(callback) {
        this.isOpen.set(false);
        this.positionFixed.restorePositionSetting();
        preventScroll.disable();
        this.transform.set('translateY(100%)');
        setTimeout(() => {
            this.transform.set('');
            if (callback) callback();
        }, 300);
    }

    startDrag(event) {

        return;

        this.isDragging.set(true);
        this.startY = event.touches ? event.touches[0].clientY : event.clientY;
        this.startTransform = this.transform.get();
        this.dragStartTime = Date.now();
    }

    handleDrag(event) {
        if (!this.isDragging.get()) return;

        // Фикс для iOS: используем requestAnimationFrame
        requestAnimationFrame(() => {
            const currentY = event.touches ? event.touches[0].clientY : event.clientY;
            const deltaY = currentY - this.startY;

            // Ограничиваем резкие движения
            const dampenedDelta = deltaY * 0.7; // Коэффициент плавности

            this.transform.set(`translateY(calc(${dampenedDelta}px))`);
        });

    }

    endDrag(event) {
        if (!this.isDragging.get()) return;

        const currentY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
        const deltaY = currentY - this.startY;
        const velocity = Math.abs(deltaY) / (Date.now() - this.dragStartTime);

        // Закрываем только если скорость и смещение достаточны
        if (deltaY > DRAG_CLOSE_THRESHOLD && velocity > DRAG_VELOCITY_THRESHOLD) {
            this.close();
        } else {
            // Плавный возврат
            this.transform.set('translateY(0)');
        }
    }

    handleKeyboard() {
        if (!isIOS()) return;

        this._keyboardResizeHandler = () => {
            const drawer = this.instance.find('[data-stvorka-drawer]');
            if (!drawer) return;

            const visualViewportHeight = window.visualViewport.height;
            const drawerHeight = drawer.getBoundingClientRect().height;

            if (drawerHeight > visualViewportHeight) {
                this.height.set(`height: ${visualViewportHeight}px`);
                this.keyboardIsOpen.set(true);
            } else {
                this.height.set('');
                this.keyboardIsOpen.set(false);
            }
        };
        window.visualViewport?.addEventListener('resize', this._keyboardResizeHandler);

        //$('#info_text').text('handleKeyboard')
    }

    forceReflow = () => {
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            document.body.style.overflow = '';
            window.scrollBy(0, 1); // Микроскролл
            window.scrollBy(0, -1);
        }, 50);
    };
}

Template.StvorkaBottomSheet.onCreated(function () {
    const requestedId = this.data.id;

    const existingInstance = activeInstances.get(requestedId);
    if (existingInstance && document.contains(existingInstance.instance.firstNode)) {
        // Просто обновляем данные
        this.data.id = requestedId;
        this.manager = existingInstance;
        return;
    }

    // Получаем ID из параметров шаблона или генерируем автоматический
    this.uniqueId = requestedId || `bottomsheet-${instanceCounter++}`;

    // Сохраняем ID в data для доступа из шаблона
    this.data.id = this.uniqueId;

    this.manager = new StvorkaBottomSheetManager(this);
});

Template.StvorkaBottomSheet.onRendered(function () {
    const template = Template.instance();

    const sheet = this.find('[data-stvorka-drawer]');
    const focusGuards = sheet.querySelectorAll('[data-stvorka-focus-guard]');

    sheet.addEventListener('focusout', (e) => {
        console.log('Focus out event triggered', focusGuards);
        // Если фокус ушёл за пределы sheet
        Meteor.setTimeout(function () {
            if (!sheet.contains(document.activeElement)) {
                // Вернуть фокус на первый guard
                focusGuards[0].focus();
                let $focusGuard = $(focusGuards[0]);
                template.manager.handleKeyboard();
            }
        }, 20);
    });

});

Template.StvorkaBottomSheet.onDestroyed(function () {
    if (this.manager) {
        // Закрываем шторку с анимацией перед уничтожением
        this.manager.close(() => {
            // Полностью очищаем экземпляр после анимации
            this.manager.destroy();
            this.manager = null;
        });
    }
});

Template.StvorkaBottomSheet.helpers({
    isOpen() {
        return Template.instance().manager.isOpen.get();
    },
    isDragging() {
        return Template.instance().manager.isDragging.get();
    },
    transformStyle() {
        return Template.instance().manager.transform.get();
    },
    heightStyle() {
        return Template.instance().manager.height.get();
    }
});

Template.StvorkaBottomSheet.events({

    'click [data-stvorka-overlay]'(event, instance) {
        // Закрываем только при клике именно на оверлей, а не его дочерние элементы
        if (event.target === event.currentTarget) {
            instance.manager.close();
        }
    },

    'touchstart [data-stvorka-handle], mousedown [data-stvorka-handle]'(event, instance) {
        // Останавливаем всплытие, чтобы не срабатывали другие обработчики
        event.preventDefault(); // Важно для iOS!
        event.stopPropagation();
        instance.manager.startDrag(event);

    },

    'touchmove [data-stvorka-drawer]': debounce(function (event, instance) {

        return;

        if (instance.manager.isDragging.get()) {
            event.preventDefault();
            instance.manager.handleDrag(event);
        }
    }, 16), // 60fps

    'touchend [data-stvorka-drawer], touchcancel [data-stvorka-drawer]'(event, instance) {

        return;

        if (instance.manager.isDragging.get()) {
            instance.manager.endDrag(event);
        }
    },
    // Обарбокта pointerdown для предотвращения потери фокуса при клике на элементы внутри шторки
    // актуально для Safari на iOS
    'pointerdown .stvorka-sheet-select'(event) {
        event.stopPropagation();
        event.preventDefault();
    },
    // Обработка для фикса на iOS
    'blur input, blur textarea, blur select'(event, instance) {
        if (!isIOS()) return;
        Meteor.setTimeout(function () {
            instance.manager.forceReflow();
        }, 20);
    }

});

// Добавляем методы API для шаблона
Template.StvorkaBottomSheet.cleanup = function (id) {
    const instance = activeInstances.get(id);
    if (instance) {
        instance.destroy();
    }
};

Template.StvorkaBottomSheet.get = function (id) {
    return activeInstances.get(id);
};

Template.StvorkaBottomSheet.getAll = function () {
    return Array.from(activeInstances.values());
};

Template.StvorkaBottomSheet.open = function () {
    const instance = Template.instance();
    if (instance) {
        instance.manager.open();
    }
};

Template.StvorkaBottomSheet.close = function () {
    const instance = Template.instance();
    if (instance) {
        instance.manager.close();
    }
};

// Глобальные методы
Template.StvorkaBottomSheet.openGlobal = function () {
    for (const instance of activeInstances.values()) {
        instance.open();
        return;
    }
    console.warn('No active StvorkaBottomSheet instances found');
};

Template.StvorkaBottomSheet.closeGlobal = function () {
    for (const instance of activeInstances.values()) {
        instance.close();
        return;
    }
};

if (typeof window.StvorkaBottomSheet === 'undefined') {
    window.StvorkaBottomSheet = {
        open: Template.StvorkaBottomSheet.openGlobal,
        close: Template.StvorkaBottomSheet.closeGlobal
    };
}