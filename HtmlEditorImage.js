/**
 * HtmlEditorImageUpload plugin for Ext htmlEditor
 *
 * Adds a button to upload/insert/edit images
 *
 * @author    Sami Racho
 * @date      December 2011
 * @version   0.1
 *
 * @license Ext.ux.form.HtmlEditor.imageUpload is licensed under the terms of
 * the Open Source LGPL 3.0 license.  Commercial use is permitted to the extent
 * that the code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 * 
 * License details: http://www.gnu.org/licenses/lgpl.html
 */
/**
 * @class Ext.ux.form.HtmlEditor.imageUpload
 *
 * Creates new HtmlEditor.imageUpload plugin
 * @constructor
 * @param {Object} config The config object
 * 
 * How to use
 * 
	Just instatiate a new HtmlEditor.imageUpload inside htmlEditor plugins option:

	xtype: 'htmleditor',
	plugins: [new Ext.create('Ext.ux.form.HtmlEditor.imageUpload', {submitUrl:'myUploadScript.php',})],
    height: 400,
    style: 'background-color: white;',
    anchor: '100%',
	value: ''
 */
Ext.define('Ext.ux.form.HtmlEditor.imageUpload', {

    /**
     * @cfg {Array} options
     * Associative array with all the strings.
     * If not specified it will show all the strings in english
     */
    lang: {
        'Display': '',
        'By Default': '',
        'Inline': '',
        'Block': '',
        'Insert/Edit Image': '',
        'Upload Image...': '',
        'Uploading your photo...': '',
        'Error': '',
        'Width': '',
        'Height': '',
        'Align': '',
        'Title': '',
        'Class': '',
        'Padding': '',
        'Margin': '',
        'Top': '',
        'Bottom': '',
        'Right': '',
        'Left': '',
        'None': '',
        'Size & Details': '',
        'More Options': '',
        'Style': '',
        'OK': '',
        'Cancel': '',
        'Delete Image': '',
        'Confirmation': '',
        'Are you sure you want to delete this image?': '',
        'Your photo has been uploaded.': ''
    },

    /**
     * @cfg {String} submitUrl
     * Path to the upload script.
     * Default 'htmlEditorImageUpload.php'
     */
    submitUrl: 'htmlEditorImageUpload.php',

    /**
     * @cfg {String} mamangerUrl
     * Path to the image manager script.
     * Default 'htmlEditorImageManager.php'
     */
    managerUrl: 'htmlEditorImageUpload.php',

    /**
     * @cfg {integer} pageSize
     * Number of images to show on the list.
     * Default 4
     */
    pageSize: 4,

/**
   * @cfg {Boolean} values are:
   * 
   * 
		true : Default
   * 
		Allows the user to resize an image clicking on it and dragging with the mouse. (Only WebKit browsers)
   * 
		false 
   * 
		The image wont be resized if the user drags on it
   * 
   * 
   */
    dragResize: true,

/**
   * @cfg {Boolean} values are:
   * 
   * 
		true : Default
   * 
		Allows the user to resize an image clicking on it and using the mousewheel. (Only WebKit browsers & Opera)
   * 
		false 
   * 
		The image wont be resized if the user uses mousewheel on it
   * 
   * 
   */
    wheelResize: true,

    /**
     * @cfg {String} iframeCss
     * Path to the iframe css file. 
     * It's important to do not merge this css with other CSS files, because it will be applied to the htmleditor 
     * iframe head. If more css rules are included, it can suffer undesired effects
     * Default 'css/iframe_styles.css'
     */
    iframeCss: 'css/iframe_styles.css',
    t: function t(string) {
        return this.lang[string] ? this.lang[string] : string;
    },
    constructor: function (config) {
        Ext.apply(this, config);
        this.callParent(arguments);
    },
    init: function (panel) {
        this.cmp = panel;
        this.cmp.on('render', this.onRender, this);
        this.cmp.on('initialize', this.initialize, this);
        this.cmp.on('beforedestroy', this.beforeDestroy, this);
    },
    initialize: function () {
        var me = this;
        var cmpDoc = this.cmp.getDoc();
        var flyDoc = Ext.fly(cmpDoc);

        // Inject custom css file to iframe's head in order to simulate image control selector on click, over webKit and Opera browsers
        if ((Ext.isWebKit || Ext.isOpera)) {

            var frameName = me.cmp.iframeEl.dom.name;
            var iframe;

            if (document.frames) iframe = document.frames[frameName];
            else iframe = window.frames[frameName];

            // we have to add our custom css file to the iframe
            var ss = iframe.document.createElement("link");
            ss.type = "text/css";
            ss.rel = "stylesheet";
            ss.href = me.iframeCss;

            if (document.all) iframe.document.createStyleSheet(ss.href);
            else iframe.document.getElementsByTagName("head")[0].appendChild(ss);
        }

        // attach event to control when the user clicks on image
        flyDoc.on({
            mouseup: me._docMouseUp,
            scope: me
        });

        // mousewheel resize event
        if ((Ext.isWebKit || Ext.isOpera) && me.wheelResize) {
            flyDoc.on({
                mousewheel: me._wheelResize,
                scope: me
            });
        }

        // mouse drag resize event
        if (Ext.isWebKit && me.dragResize) {
            flyDoc.on({
                drag: me._dragResize,
                scope: me
            });
        }

		// double click on image
        flyDoc.on({
            dblclick: me._dblClick,
            scope: me
        });
		
        // to remove custom attr
        flyDoc.on({
            paste: me._removeSelectionHelpers,
            scope: me
        });
    },	
    beforeDestroy: function () {
        var me = this;
        var flyDoc = Ext.fly(me.cmp.getDoc());

        if (me.uploadDialog) me.uploadDialog.destroy();
        flyDoc.un('mouseup', me._docMouseUp, me);
		flyDoc.un('dblclick', me._dblClick, me);
        if (me.wheelResize) flyDoc.un('mousewheel', me._wheelResize, me);
        if (me.dragResize) flyDoc.un('drag', me._dragResize, me);
        flyDoc.un('paste', me._removeSelectionHelpers, me);
    },
    onRender: function () {

        var uploadButton = Ext.create('Ext.button.Button', {
            iconCls: 'x-htmleditor-imageupload',
            handler: this._uploadImage,
            scope: this,
            tooltip: this.t('Insert/Edit Image'),
            overflowText: this.t('Insert/Edit Image')
        });

        var toolbar = this.cmp.getToolbar();

        // we save a reference to this button to use it later
        this.uploadButton = uploadButton;

        this.cmp.getToolbar().add(uploadButton);

    },
	// private
	_dblClick: function(evt)
	{
		var me = this;
		var target =evt.getTarget();
		
		if(target.tagName == "IMG")
		{
			me._uploadImage()
		}
	},
    //private
    _uploadImage: function () {

        var me = this;
        var cmp = this.cmp;
        var doc = this.cmp.getDoc();
        var win = this.cmp.win;
        var sel = "";
        var range = "";
        var image = "";
        var imagesList = doc.body.getElementsByTagName("IMG");
        var imagesListLength = imagesList.length;

        //insertAtCursor function is completely useless for this purpose, so I need to write all this stuff to insert html at cursor position	
        // I need to know if the browser uses the W3C way or the Internet Explorer method
        var ieBrowser = doc.selection && doc.selection.createRange ? true : false;
        var nonIeBrowser = win.getSelection && win.getSelection().getRangeAt ? true : false;

        if (nonIeBrowser) {
            sel = win.getSelection();
            // if focus is not in htmleditor area
            try {
                range = sel.getRangeAt(0);
            } catch (err) {
                win.focus();
                range = sel.getRangeAt(0);
            }

        } else if (ieBrowser) {
            //it's compulsory to get the focus before creating the range, if not we'll lose the caret position
            win.focus();
            sel = doc.selection;
            range = sel.createRange();
        }

        // to make the things easier, if the user has an image selected when he presses the image upload button, I mark it with a custom attr "iu_edit".
        // afterwards, if the user presses the ok button I just need to find the image with that attr, and replace it with the new one.
        if (Ext.isIE && sel.type == "Control") {
            if (range.item(0).tagName == "IMG") image = r;
        } else if (range.startContainer == range.endContainer) {
            if (range.endOffset - range.startOffset < 2) {
                if (range.startContainer.hasChildNodes()) {
                    var r = range.startContainer.childNodes[range.startOffset];
                    if (r.tagName == "IMG") image = r;
                }
            }
        }

        if (!image) {
            //if we dont find the image we try to search by editable attr
            for (i = 0; i < imagesListLength; i++) {
                if (parseInt(imagesList[i].getAttribute('iu_edit')) > 0) {
                    image = imagesList[i];
                    break;
                }
            }
        }

        me.uploadDialog = Ext.create('Ext.ux.form.HtmlEditor.ImageDialog', {
            lang: me.lang,
            t: me.t,
            submitUrl: me.submitUrl,
            managerUrl: me.managerUrl,
            iframeDoc: doc,
            imageToEdit: image,
            pageSize: me.pageSize,
            uploadButton: me.uploadButton,
        });

        me.uploadDialog.on('close', function () {
            if (Ext.isIE) {
                me.uploadButton.toggle(false);
                me._removeSelectionHelpers()
            }
        }, me);

        me.uploadDialog.on('imageloaded', function () {

            var newImage = this.getImage();

            // if it's an edited image, we have to replace it with the new values
            if (image != "") {
                for (i = 0; i < imagesListLength; i++) {
                    if (parseInt(imagesList[i].getAttribute('iu_edit')) > 0) {
                        if (nonIeBrowser) {
                            imagesList[i].parentNode.replaceChild(newImage, imagesList[i]);
                            try {
                                if (sel) {
                                    sel.selectAllChildren(doc.body);
                                    sel.collapseToStart();
                                }

                            } catch (ex) {};
                        } else if (ieBrowser) {
                            imagesList[i].outerHTML = newImage.outerHTML;
                        }
                        break;
                    }
                }
            }
            // if not we just insert a new image on the document
            else {
                if (nonIeBrowser) {
                    range.insertNode(newImage);
                } else if (ieBrowser) {
                    win.focus();
                    range.select();
                    range.pasteHTML(newImage.outerHTML);
                }
            }

            me.imageToEdit = "";
            this.close();
            me.uploadButton.toggle(false);
        });

        me.uploadDialog.loadImageDetails();
        me.uploadDialog.show();
    },
    //private	
    _removeSelectionHelpers: function () {
        var me = this;
        var imagesList = me.cmp.getDoc().body.getElementsByTagName("IMG");
        var imagesListLength = imagesList.length;

        for (i = 0; i < imagesListLength; i++) {
            imagesList[i].removeAttribute('iu_edit');
        }
    },
    _wheelResize: function (e) {
        var target = e.getTarget();
        if (target.tagName == "IMG" && target.getAttribute('iu_edit') == 1) {
            var delta = e.getWheelDelta();
            var width = target.style.width ? parseInt(target.style.width.replace(/[^\d.]/g, "")) : target.width;
            var height = target.style.height ? parseInt(target.style.height.replace(/[^\d.]/g, "")) : target.height;

            target.style.width = (delta < 1) ? width - 10 : width + 10;
            target.style.height = (delta < 1) ? height - 10 : height + 10;

            e.preventDefault();
        } else return;
    },
    _dragResize: function (e) {

        var target = e.getTarget();

        if (target.tagName == "IMG" && target.getAttribute('iu_edit') == 1) {

            var width = e.getX() - target.offsetLeft;
            var height = e.getY() - target.offsetTop;
            target.style.width = width + "px";
            target.style.height = height + "px";

            e.preventDefault();
        } else return;
    },
    // when user clicks on content editable area
    _docMouseUp: function (evt) {

        var me = this;
        var target = evt.getTarget();

        me._removeSelectionHelpers();

        if (target.tagName == "IMG") {
            me.uploadButton.toggle(true);
            if ((me.wheelResize || me.dragResize) && (Ext.isWebKit || Ext.isOpera)) target.setAttribute('iu_edit', '1');
            else target.setAttribute('iu_edit', '2');

            // select image. 
            // On safari if we copy and paste the image, class attrs are converted to inline styles. It's a browser bug.
            if (Ext.isWebKit) {
                var sel = this.cmp.getWin().getSelection ? this.cmp.getWin().getSelection() : this.cmp.getWin().document.selection;
                sel.setBaseAndExtent(target, 0, target, 1);
            }
        } else me.uploadButton.toggle(false);
    }
});

Ext.define('Ext.ux.form.HtmlEditor.ImageDialog', {
    extend: 'Ext.window.Window',
    lang: null,
    lang: null,
    t: null,
    submitUrl: null,
    managerUrl: null,
    iframeDoc: null,
    pageSize: 4,
    imageToEdit: '',
    closeAction: 'destroy',
    width: 460,
    modal: true,
    resizable: false,
    layout: {
        type: 'fit'
    },
    title: '',
    listeners: {
        show: function (panel) {
            // we force the focus on the dialog window to avoid control artifacts on IE
            panel.down('[name=src]').focus();
        }
    },
	setPreviewImage: function(src)
	{
		if(!this.previewComponent)this.previewComponent = this.down('#vistaPrevia');
		this.previewComponent.setWidth('');
		this.previewComponent.setHeight('');
		this.previewComponent.setSrc(src);
	},
	resizePreviewImage: function(evt,el)
	{
		var comp = this;
		var image = el;	
		var width, height;
		var maxWidth = maxHeight = 124;
		if(image.src)
		{
			if(image.width >= image.height ){
				width = image.width < maxWidth ? image.width : maxWidth; 
				height = Math.ceil((width/image.width)*image.height)
			}else{
				height = image.height < maxHeight ? image.height : maxHeight;  
				width = Math.ceil((height/image.height)*image.width)
			}
			
			comp.setWidth(width);
			comp.setHeight(height);
		}
	},
    initComponent: function () {
        var me = this;
        var imageStore = Ext.create('Ext.data.Store', {
            fields: [{
                name: 'name',
                type: 'string'
            }, {
                name: 'fullname',
                type: 'string'
            }, {
                name: 'src',
                type: 'string'
            }],
            proxy: {
                type: 'ajax',
                url: me.managerUrl,
                extraParams: {
                    action: 'imagesList'
                },
                reader: {
                    type: 'json',
                    root: 'data'
                }
            },
            autoLoad: false,
            pageSize: me.pageSize
        });

        var alignStore = Ext.create('Ext.data.ArrayStore', {
            autoDestroy: true,
            idIndex: 0,
            fields: [{
                name: 'name',
                type: 'string'
            }, {
                name: 'value',
                type: 'string'
            }],
            data: [
                [me.t('Left'), 'left'],
                [me.t('None'), 'none'],
                [me.t('Right'), 'right']
            ]
        });

        var displayStore = Ext.create('Ext.data.ArrayStore', {
            autoDestroy: true,
            idIndex: 0,
            fields: [{
                name: 'name',
                type: 'string'
            }, {
                name: 'value',
                type: 'string'
            }],
            data: [
                [me.t('By Default'), ''],
                [me.t('Inline'), 'inline'],
                [me.t('Block'), 'block']
            ]
        });

        var unitsStore = Ext.create('Ext.data.ArrayStore', {
            autoDestroy: true,
            idIndex: 0,
            fields: [{
                name: 'name',
                type: 'string'
            }, {
                name: 'value',
                type: 'string'
            }],
            data: [
                ['px', 'px'],
                ['%', '%'],
                ['em', 'em'],
                ['in', 'in'],
                ['cm', 'cm'],
                ['mm', 'mm'],
                ['ex', 'ex'],
                ['pt', 'pt'],
                ['pc', 'pc']
            ]
        });

        me.items = [{
            xtype: 'form',
            name: 'imageUploadForm',
            bodyPadding: 10,
            items: [{
                xtype: 'fieldcontainer',
                height: 36,
                padding: 4,
                width: 450,
                layout: {
                    columns: 2,
                    type: 'column'
                },
                fieldLabel: '',
                items: [{
                    xtype: 'combobox',
                    name: 'src',
                    queryMode: 'local',
                    fieldLabel: 'Url',
                    labelWidth: 50,
                    columnWidth: 0.70,
                    margin: '0 4 0 0',
                    editable: true,
                    allowBlank: true,
                    emptyText: '',
                    value: '',
                    store: imageStore,
                    displayField: 'src',
                    valueField: 'src',
					checkChangeBuffer:200,
                    listeners: {
                        expand: function (combo, options) {
                            combo.store.load(combo.store.lastOptions);
                        },
						change: function(combo)
						{
							me.setPreviewImage(combo.getValue());
						}
                    },
                    listConfig: {
                        loadingText: 'Searching...',
                        emptyText: 'No matching posts found.',

                        // Custom rendering template for each item
                        getInnerTpl: function () {
                            return '<img class="x-htmleditor-imageupload-thumb" src="{src}" /><div class="x-htmleditor-imageupload-name">{name}</div><a title="' + me.t('Delete Image') + '" href="#" img_fullname="{fullname}" class="x-htmleditor-imageupload-delete"></a>';
                        },
                        listeners: {
                            el: {
                                click: {
                                    delegate: 'a.x-htmleditor-imageupload-delete',
                                    fn: function (ev, a) {
                                        Ext.Msg.show({
                                            title: me.t('Confirmation'),
                                            msg: me.t('Are you sure you want to delete this image?'),
                                            buttons: Ext.Msg.YESNO,
                                            closable: false,
                                            fn: function (btn) {
                                                if (btn == 'yes') {
                                                    Ext.Ajax.request({
                                                        url: me.managerUrl,
                                                        method: 'POST',
                                                        params: {
                                                            'action': 'delete',
                                                            'image': a.getAttribute('img_fullname')
                                                        },
                                                        success: function (fp, o) {
                                                            var combo = me.down('[name=src]');
                                                            combo.setValue('');
                                                            me.down('form').getForm().reset();
															me.setPreviewImage('');
                                                        },
                                                        failure: function (form, action) {
                                                            Ext.Msg.alert(me.t('Error'), 'Error: ' + action.result.errors);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    },
                    pageSize: me.pageSize
                }, {
                    xtype: 'filefield',
                    buttonOnly: true,
                    name: 'photo-path',
                    name: 'photo-path',
                    value: '',
                    columnWidth: 0.30,
                    buttonText: me.t('Upload Image...'),
                    listeners: {
                        change: function () {
                            var form = this.up('form').getForm();
                            if (form.isValid()) {
                                form.submit({
                                    url: me.submitUrl + '?action=upload',
                                    waitMsg: me.t('Uploading your photo...'),
                                    success: function (fp, o) {
                                        Ext.Msg.alert('Success', me.t('Your photo has been uploaded.'));
                                        var combo = me.down('[name=src]');
                                        combo.setRawValue(o.result.data['src']);
										me.setPreviewImage(o.result.data['src']);
                                    },
                                    failure: function (form, action) {
                                        Ext.Msg.alert(me.t('Error'), 'Error: ' + action.result.errors);
                                        me.down('[name=photo-path]').reset();
                                    }
                                });
                            }
                        }
                    }
                }]
            }, {
                xtype: 'fieldset',
                title: me.t('More Options'),
                itemId: 'fieldOptions',
                collapsible: true,
                layout: 'anchor',
                collapsed: true,
                defaults: {
                    anchor: '100%',
                    labelWidth: 72
                },
                items: [{
                    xtype: 'fieldset',
                    title: me.t('Size & Details'),
                    collapsible: true,
                    layout: 'anchor',
                    collapsed: false,
					layout: {
                            type: 'table',
                            columns: 2
                    },
                    defaults: {
                        anchor: '100%',
                        labelWidth: 72
                    },
                    items: [	
					{
						xtype: 'container',
						margin:4,
						padding:1,
						layout: {
							align: 'middle',
							pack: 'center',
							type: 'hbox'
						},
						style: {
							border: '1px solid #ccc',
						},
						height: 128,
						width: 128,
						items: [
						{
							xtype: 'image',
							itemId: 'vistaPrevia',
							listeners:{
								render: function(comp){
									var flyImg = Ext.fly(comp.getEl().dom);
									flyImg.on('load',me.resizePreviewImage,comp);
								},
								beforedestroy: function(comp){
									var flyImg = Ext.fly(comp.getEl().dom);
									flyImg.un('load',me.resizePreviewImage,comp);
								}
							}
						}]
					},{
                        xtype: 'fieldcontainer',
                        layout: {
                            type: 'table',
                            columns: 2
                        },
                        fieldLabel: '',
                        defaults: {

                            labelSeparator: ' ',
                            labelAlign: 'left',
                            labelWidth: 72,
                            decimalSeparator: '.',
                            width: 180,
                            margin: '0 4 4 0'

                        },
                        items: [{
							colspan:2,
							xtype: 'combobox',
							width:232,
							name: 'float',
							queryMode: 'local',
							editable: false,
							allowBlank: false,
							fieldLabel: me.t('Align'),
							value: 'left',
							store: alignStore,
							displayField: 'name',
							valueField: 'value'
						},{
                            xtype: 'numberfield',
                            fieldLabel: me.t('Width'),
                            name: 'width'
                        }, {
                            xtype: 'combobox',
                            name: 'widthUnits',
                            queryMode: 'local',
                            fieldLabel: '',
                            width: 48,
                            editable: false,
                            allowBlank: false,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: me.t('Height'),
                            name: 'height'
                        }, {
                            xtype: 'combobox',
                            name: 'heightUnits',
                            queryMode: 'local',
                            fieldLabel: '',
                            width: 48,
                            editable: false,
                            allowBlank: false,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
							colspan:2,
							xtype: 'checkboxfield',
							fieldLabel: '',
							name:'consProp',
							boxLabel: 'Constrain proportions',
							disabled:true
						}]
                    }]
                }, {
                    xtype: 'fieldset',
                    title: me.t('Style'),
                    collapsible: true,
                    layout: 'anchor',
                    collapsed: true,
                    items: [{
                        xtype: 'combobox',
                        name: 'display',
                        queryMode: 'local',
                        editable: false,
                        anchor: '100%',
                        labelWidth: 72,
                        allowBlank: false,
                        fieldLabel: me.t('Display'),
                        emptyText: me.t('None'),
                        value: '',
                        store: displayStore,
                        displayField: 'name',
                        valueField: 'value'
                    }, {
                        xtype: 'textfield',
                        name: 'title',
                        labelWidth: 72,
                        anchor: '100%',
                        fieldLabel: me.t('Title')
                    }, {
                        xtype: 'textfield',
                        name: 'className',
                        labelWidth: 72,
                        anchor: '100%',
                        fieldLabel: me.t('Class')
                    }, {
                        xtype: 'fieldcontainer',
                        layout: {
                            type: 'table',
                            columns: 4
                        },
                        fieldLabel: me.t('Padding'),
                        labelWidth: 73,
                        defaults: {

                            labelSeparator: ' ',
                            labelAlign: 'left',
                            labelWidth: 48,
                            width: 98,
                            decimalSeparator: '.',
                            margin: '0 4 4 0'

                        },
                        items: [{
                            xtype: 'numberfield',
                            fieldLabel: me.t('Top'),
                            name: 'paddingTop'
                        }, {
                            xtype: 'combobox',
                            name: 'paddingTopUnits',
                            queryMode: 'local',
                            fieldLabel: '',
                            width: 48,
                            editable: false,
                            allowBlank: false,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: me.t('Right'),
                            name: 'paddingRight'
                        }, {
                            xtype: 'combobox',
                            name: 'paddingRightUnits',
                            queryMode: 'local',
                            fieldLabel: '',
                            width: 48,
                            editable: false,
                            allowBlank: false,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: me.t('Bottom'),
                            name: 'paddingBottom'
                        }, {
                            xtype: 'combobox',
                            name: 'paddingBottomUnits',
                            fieldLabel: '',
                            queryMode: 'local',
                            editable: false,
                            allowBlank: false,
                            width: 48,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: me.t('Left'),
                            name: 'paddingLeft'
                        }, {
                            xtype: 'combobox',
                            name: 'paddingLeftUnits',
                            fieldLabel: '',
                            queryMode: 'local',
                            editable: false,
                            allowBlank: false,
                            width: 48,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value',
                            margin: '0'
                        }]
                    }, {
                        xtype: 'fieldcontainer',
                        layout: {
                            type: 'table',
                            columns: 4
                        },
                        fieldLabel: me.t('Margin'),
                        labelWidth: 73,
                        defaults: {

                            labelSeparator: ' ',
                            labelAlign: 'left',
                            labelWidth: 48,
                            width: 98,
                            margin: '0 4 4 0'

                        },
                        items: [{
                            xtype: 'numberfield',
                            fieldLabel: me.t('Top'),
                            name: 'marginTop'
                        }, {
                            xtype: 'combobox',
                            name: 'marginTopUnits',
                            queryMode: 'local',
                            fieldLabel: '',
                            width: 48,
                            editable: false,
                            allowBlank: false,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: me.t('Right'),
                            name: 'marginRight'
                        }, {
                            xtype: 'combobox',
                            name: 'marginRightUnits',
                            queryMode: 'local',
                            fieldLabel: '',
                            width: 48,
                            editable: false,
                            allowBlank: false,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: me.t('Bottom'),
                            name: 'marginBottom'
                        }, {
                            xtype: 'combobox',
                            name: 'marginBottomUnits',
                            fieldLabel: '',
                            queryMode: 'local',
                            editable: false,
                            allowBlank: false,
                            width: 48,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: me.t('Left'),
                            name: 'marginLeft'
                        }, {
                            xtype: 'combobox',
                            name: 'marginLeftUnits',
                            fieldLabel: '',
                            queryMode: 'local',
                            editable: false,
                            allowBlank: false,
                            width: 48,
                            emptyText: 'None',
                            value: 'px',
                            store: unitsStore,
                            displayField: 'name',
                            valueField: 'value',
                            margin: '0'
                        }]
                    }]
                }]
            }

            ],
            dockedItems: [{
                xtype: 'container',
                dock: 'bottom',
                padding: 4,
                items: [{
                    xtype: 'button',
                    style: {
                        'float': 'right'
                    },
                    text: me.t('Cancel'),
                    handler: me.close,
                    scope: me
                }, {
                    xtype: 'button',
                    style: {
                        'float': 'right',
                        'margin-right': '8px'
                    },
                    text: me.t('OK'),
                    formBind: true,
                    handler: function () {
                        me.fireEvent('imageloaded');
                    },
                    scope: me
                }]
            }]
        }];
        me.keys = [{
            key: [Ext.EventObject.ENTER],
            handler: function () {
                me.onSearchClick
            }
        }];
        me.callParent(arguments);
        me.setTitle(me.t('Insert/Edit Image'));
    },
    loadImageDetails: function () {

        var image = this.imageToEdit;

        //if user has an image selected get the image attrs
        if (image != "") {

            var cssFloat = "";
            if (Ext.isIE) {
                cssFloat = image.style.styleFloat ? image.style.styleFloat : 'none';
            } else {
                cssFloat = image.style.cssFloat ? image.style.cssFloat : 'none';
            }


            var values = {
                'display': image.style.display ? image.style.display : '',
                'width': image.style.width ? image.style.width.replace(/[^\d.]/g, "") : image.width,
                'height': image.style.height ? image.style.height.replace(/[^\d.]/g, "") : image.height,
                'widthUnits': image.style.width ? image.style.width.replace(/[\d.]/g, "") : 'px',
                'display': image.style.display ? image.style.display : '',
                'widthUnits': image.style.width ? image.style.width.replace(/[\d.]/g, "") : 'px',
                'heightUnits': image.style.height ? image.style.height.replace(/[\d.]/g, "") : 'px',
                'paddingTop': image.style.paddingTop ? image.style.paddingTop.replace(/[^\d.]/g, "") : '',
                'paddingTopUnits': image.style.paddingTop ? image.style.paddingTop.replace(/[\d.]/g, "") : 'px',
                'paddingLeft': image.style.paddingLeft ? image.style.paddingLeft.replace(/[^\d.]/g, "") : '',
                'paddingLeftUnits': image.style.paddingLeft ? image.style.paddingLeft.replace(/[\d.]/g, "") : 'px',
                'paddingBottom': image.style.paddingBottom ? image.style.paddingBottom.replace(/[^\d.]/g, "") : '',
                'paddingBottomUnits': image.style.paddingBottom ? image.style.paddingBottom.replace(/[\d.]/g, "") : 'px',
                'paddingRight': image.style.paddingRight ? image.style.paddingRight.replace(/[^\d.]/g, "") : '',
                'paddingRightUnits': image.style.paddingRight ? image.style.paddingRight.replace(/[\d.]/g, "") : 'px',
                'marginTop': image.style.marginTop ? image.style.marginTop.replace(/[^\d.]/g, "") : '',
                'marginTopUnits': image.style.marginTop ? image.style.marginTop.replace(/[\d.]/g, "") : 'px',
                'marginLeft': image.style.marginLeft ? image.style.marginLeft.replace(/[^\d.]/g, "") : '',
                'marginLeftUnits': image.style.marginLeft ? image.style.marginLeft.replace(/[\d.]/g, "") : 'px',
                'marginBottom': image.style.marginBottom ? image.style.marginBottom.replace(/[^\d.]/g, "") : '',
                'marginBottomUnits': image.style.marginBottom ? image.style.marginBottom.replace(/[\d.]/g, "") : 'px',
                'marginRight': image.style.marginRight ? image.style.marginRight.replace(/[^\d.]/g, "") : '',
                'marginRightUnits': image.style.marginRight ? image.style.marginRight.replace(/[\d.]/g, "") : 'px',
                'title': image.title,
                'className': image.className.replace("x-htmleditor-imageupload-bordeResize", "").replace("x-htmleditor-imageupload-bordeSelect", ""),
                'src': image.src,
                'float': cssFloat
            };

            this.down('form').getForm().setValues(values);
            this.down('[name=src]').setRawValue(values['src']);
            this.down('#fieldOptions').expand();
        } else this.down('#fieldOptions').collapse();
    },
    getImage: function () {
        // we have to create the node on iframe's document or Opera will explode!
        var image = this.iframeDoc.createElement("img");
        var values = this.down('form').getForm().getValues();

        // set image attrs
        image.setAttribute('src', values['src']);
        if (values['title']) image.setAttribute('title', values['title']);
        if (values['className']) image.className = values['className'];
        if (values['display']) image.style.display = values['display'];
        if (values['width']) image.style.width = values['width'] + values['widthUnits'];
        if (values['height']) image.style.height = values['height'] + values['heightUnits'];
        if (values['paddingTop']) image.style.paddingTop = values['paddingTop'] + values['paddingTopUnits'];
        if (values['paddingBottom']) image.style.paddingBottom = values['paddingBottom'] + values['paddingBottomUnits'];
        if (values['paddingLeft']) image.style.paddingLeft = values['paddingLeft'] + values['paddingLeftUnits'];
        if (values['paddingRight']) image.style.paddingRight = values['paddingRight'] + values['paddingRightUnits'];
        if (values['marginTop']) image.style.marginTop = values['marginTop'] + values['marginTopUnits'];
        if (values['marginBottom']) image.style.marginBottom = values['marginBottom'] + values['marginBottomUnits'];
        if (values['marginLeft']) image.style.marginLeft = values['marginLeft'] + values['marginLeftUnits'];
        if (values['marginRight']) image.style.marginRight = values['marginRight'] + values['marginRightUnits'];
        if (values['cssFloat'] != 'none') {
            if (Ext.isIE) {
                image.style.styleFloat = values['float'];
            } else image.style.cssFloat = values['float'];
        }

        //internet explorer add this two attrs, and we dont need them
        image.removeAttribute("width");
        image.removeAttribute("height");

        return image;
    }
});