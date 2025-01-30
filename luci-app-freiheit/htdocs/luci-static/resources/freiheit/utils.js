'use strict';
'require baseclass';

return baseclass.extend({

    addCSS: function () {
        document.querySelector('head').appendChild(E('link', {
            'rel': 'stylesheet',
            'type': 'text/css',
            'href': L.resource('freiheit/freiheit.css')
        }));
    },

    validateURL: function (section_id, value) {
        try {
            new URL(value);
            return true;
        } catch (err) {
            return _('Expecting: Valid URL');;
        }
    },

    wait: function (timeout, data) {
        return new Promise(resolve => setTimeout(() => resolve(data), timeout));
    },

    truncate: function (str, n) {
        return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
    },

    capitalizeString: function (input) {
        return String(input).charAt(0).toUpperCase() + String(input).slice(1);
    },

    generateShortUUID: function () {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let uuid = '';
        for (let i = 0; i < 8; i++) {
            uuid += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return uuid;
    }

});


