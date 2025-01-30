'use strict';
'require baseclass';
'require form';
'require uci';
'require ui';
'require freiheit.rpcclient as rpcclient';


var Spinner = {

    show: function (text) {
        let img = E('img', { 'src': L.resource(['icons/loading.gif']) });
        let div = E('div', {}, [text, img])
        ui.showModal('', div, 'spinner');
    },

    hide: function () {
        ui.hideModal();
    },

};

var SaveChangesPopup = {

    ensureChangesAreSaved: function () {
        return uci.changes().then(this._handleChanges.bind(this))
    },

    _handleChanges: function (changes) {
        if (Object.keys(changes).length == 0) {
            return;
        }
        let answer = confirm('You have unsaved changes. Do you want to save them before resuming the operation?');
        if (!answer) {
            throw new Error("User canceled the operation.");
        }
        return uci.save()
            .then(L.bind(uci.apply, uci))
            .then(L.bind(L.ui.changes.init, L.ui.changes))
            .catch(err => {
                ui.addNotification(null, _('Failed to save changes: ') + err.message, 'error');
                throw err;
            });

    },

}

var AlignedSection = form.TypedSection.extend({

    __init__: function (map, title, description) {
        this.super('__init__', [map, '_', title, description]);
        this.anonymous = true;
    },

    cfgsections: function () {
        return [""];
    },

    renderContents: function (cfgsections, childNodes) {
        let titleEl = this.title ? E('h3', {}, this.title) : '';
        let descriptionEl = this.description ? E('div', { 'class': 'cbi-section-descr' }, this.description) : '';
        let childrenEl = E('div', { 'style': this.getStyle() }, childNodes);
        return E('div', {}, [titleEl, descriptionEl, childrenEl]);
    }

});

var HorizontalSection = AlignedSection.extend({

    getStyle: function () {
        return 'display: inline-flex; flex-direction: row; gap: 10px;';
    }

});

var VerticalSection = AlignedSection.extend({

    getStyle: function () {
        return 'display: inline-flex; flex-direction: column; gap: 0;';
    }

});

var MultiValue = form.DummyValue.extend({

    __init__: function () {
        this.super('__init__', arguments);
        this.alignment = 'horizontal';
    },

    addChild: function (cbiClass) {
        if (!form.AbstractValue.isSubclass(cbiClass))
            throw L.error('TypeError', 'Class must be a descendent of CBIAbstractValue');
        var obj = cbiClass.instantiate(this.varargs(arguments, 1, this.map, this.section));
        obj.description = null;
        this.append(obj);
        return obj;
    },

    renderWidget: function () {
        let children = this.renderChildren(null, "_", true);
        return Promise.resolve(children).then(children => {
            children = children.map(child => child.childNodes[0]);
            let flexDirection = (this.alignment == 'vertical') ? 'flex-direction: column;' : 'flex-direction: row;';
            return E('span', { class: 'cbi-value-field', 'style': `display: flex; gap: 10px; ${flexDirection}` }, children);
        });;
    }

})

var UpdateSubscriptionsButton = form.Button.extend({

    onButtonClick: function () {
        SaveChangesPopup.ensureChangesAreSaved()
            .then(this.download.bind(this))
            .catch(err => {
                console.log(`Error: ${err.message}`);
            });
    },

    download: function () {
        Spinner.show("Updating Subscriptions...");
        rpcclient.download_subscriptions()
            .then(L.bind(uci.unload, uci, this.map.config))
            .then(L.bind(uci.load, uci, this.map.config))
            .then(L.bind(this.map.load, this.map))
            .then(L.bind(this.map.reset, this.map))
            .then(function () {
                ui.addNotification(null, _('Subscriptions updated successfully.'), 3000, 'success', 'auto-fade-out');
            })
            .catch(err => {
                ui.addNotification(null, _('Failed to update subscriptions: ') + err.message, 'error');
            })
            .finally(() => {
                Spinner.hide();
            });
    },

    render: function () {
        let button = E('button', { 'class': 'cbi-button cbi-button-apply', 'click': this.onButtonClick.bind(this) }, "Update Subscriptions");
        let section = E('div', { 'class': 'cbi-section-create' }, button);
        return section;
    }

});


var DeleteNodesButton = form.Button.extend({

    onClick: function () {
        Spinner.show("Deleting nodes...");
        rpcclient.delete_nodes()
            .then(L.bind(uci.unload, uci, this.map.config))
            .then(L.bind(uci.load, uci, this.map.config))
            .then(L.bind(this.map.load, this.map))
            .then(L.bind(this.map.reset, this.map))
            .then(function () {
                ui.addNotification(null, _('Nodes deleted successfully.'), 3000, 'success', 'auto-fade-out');
            })
            .catch(err => {
                ui.addNotification(null, _('Failed to delete nodes: ') + err.message, 'error');
            })
            .finally(() => {
                Spinner.hide();
            });
    },

    render: function () {
        let button = E('button', { 'class': 'cbi-button cbi-button-apply', 'click': this.onClick.bind(this) }, "Delete Nodes");
        let section = E('div', { 'class': 'cbi-section-create' }, button);
        return section;
    }

});

return baseclass.extend({

    Spinner: Spinner,
    SaveChangesPopup: SaveChangesPopup,
    HorizontalSection: HorizontalSection,
    VerticalSection: VerticalSection,
    MultiValue, MultiValue,
    UpdateSubscriptionsButton: UpdateSubscriptionsButton,
    DeleteNodesButton: DeleteNodesButton,

});
