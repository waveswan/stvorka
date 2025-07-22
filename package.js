Package.describe({
    name: 'waveswan:stvorka',
    version: '0.1.0',
    summary: 'Bottom Sheet for Meteor with Blaze',
    git: ''
});

Package.onUse(function(api) {
    api.versionsFrom('2.0');
    api.use([
        'ecmascript',
        'templating@1.4.0',
        'blaze-html-templates',
        'reactive-var'
    ], 'client');

    api.addFiles('client/stvorka.html', 'client');
    api.addFiles('client/stvorka.css', 'client');

    api.addFiles('lib/browser.js', 'client');
    api.addFiles('lib/position-fixed.js', 'client');
    api.addFiles('lib/prevent-scroll.js', 'client');

    api.mainModule('client/stvorka.js', 'client');
});