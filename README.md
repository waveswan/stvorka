# 🌳️ Stvorka

Stvorka это Bottom Sheet для Meteor/Blaze  
Главная особенность: она работает на iOS с input внутри.
## 🍏 iOS особенности

- Автоматическая адаптация под Safe Area
- Корректная работа с клавиатурой
- Оптимизированные анимации
## Установка
```bash
meteor add waveswan:stvorka
```

## Базовое использование

### В шаблоне

```html
<template name="myTemplate">
  {{#StvorkaBottomSheet}}
    <div class="custom-content">
      <h3>Мой контент</h3>
      <button class="btn-close">Закрыть</button>
    </div>
  {{/StvorkaBottomSheet}}
</template>
```
### Управление через JS

```javascript
// Открыть
Template.StvorkaBottomSheet.openGlobal();

// Закрыть 
Template.StvorkaBottomSheet.closeGlobal();
```
### Несколько экземпляров

```html
{{#StvorkaBottomSheet id="notifications"}}
  {{> notificationsPanel}}
{{/StvorkaBottomSheet}}
```
```javascript
const sheet = Template.StvorkaBottomSheet.get('notifications');
sheet.open();
```
## Расширенные возможности

## Callback-функции

Вы можете подписаться на события открытия и закрытия Bottom Sheet:

```javascript
const sheet = Template.StvorkaBottomSheet.get('mySheetId');

// Подписка на события
sheet.onOpen(() => {
    console.log('Bottom Sheet opened!');
}).onClose(() => {
    console.log('Bottom Sheet closed!');
});

// Или по отдельности
sheet.onOpen(() => {
    console.log('Bottom Sheet opened!');
});

sheet.onClose(() => {
    console.log('Bottom Sheet closed!');
});

// Открытие после подписки
sheet.open();
```

### API методов

| Метод	   |Описание|
|----------|--------|
| .open()	 |Открыть текущий экземпляр
| .close()	 |Закрыть текущий экземпляр
| .get(id)	 |Получить экземпляр по ID
| .getAll()	 |Получить все экземпляры
## Стилизация

### Основные CSS-классы:

```css
.stvorka-sheet { /* Контейнер */ }
.stvorka-sheet-overlay { /* Подложка */ }
.stvorka-sheet-handle { /* Ручка */ }
```
## Пример с формой

```html
{{#StvorkaBottomSheet id="main"}}
  <form class="auth-form">
    <input type="text" placeholder="Email">
    <button type="submit">Войти</button>
  </form>
{{/StvorkaBottomSheet}}
```
```javascript
Template.template.onRendered(function () {
    const template = Template.instance();
    const sheet = Template.StvorkaBottomSheet.get('main');
    sheet.onClose(() => {
        console.log('Notifications sheet closed');
    });
    // Добавляем время для анимации
    Meteor.setTimeout(function () {
        sheet.open();
    }, 50);
});

Template.template.events({
    'submit .auth-form'(event) {
        event.stopPropagation();
        // Обработка формы
        Template.StvorkaBottomSheet.get('main').close();
    }
});
```
## Лучшие практики

- Всегда используйте event.stopPropagation() для форм
- Для важных шторок указывайте явные ID
- Сохраняйте структуру data-атрибутов при кастомизации
## Лицензия

MIT