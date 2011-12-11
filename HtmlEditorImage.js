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
		'Style':'',
		'OK' : '',
		'Cancel': ''
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
	wheelResize:true,
	
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
    },
    // function to allow image resizing on webkit browsers (safari / chrome)
    // it will be called from the htmleditor iframe
    _webKitResize: function (evt, document, window) {

        var me = this;
		var imgs = document.body.getElementsByTagName("IMG");

        var mouseWheelResize = function (e) {
                var event = window.event || e;

                if (this.className.search("x-htmleditor-imageupload-bordeResize") > 0 ) {
                    var delta = event.detail ? event.detail * (-120) : event.wheelDelta
                    this.style.width = (delta <= -120) ? this.width - 10 : this.width + 10;
                    this.style.height = (delta <= -120) ? this.height - 10 : this.height + 10;
                    if (event.preventDefault) event.preventDefault();
                    else return false
                } else return;
            };

        var mouseDragResize = function (event) {
                var width = event.pageX - this.offsetLeft;
                var height = event.pageY - this.offsetTop;
                this.style.width = width + "px";
                this.style.height = height + "px";

                if (event.preventDefault) event.preventDefault();
                else return false
            };

        for (i = 0; i < imgs.length; i++) {
            imgs[i].className = imgs[i].className.replace(" x-htmleditor-imageupload-bordeResize", "").replace(" x-htmleditor-imageupload-bordeSelect", "");
            if (imgs[i].className == "") imgs[i].removeAttribute("class");
            if (Ext.isWebKit && me.dragResize) imgs[i].removeEventListener('drag', mouseDragResize, false);
            if(me.wheelResize)imgs[i].removeEventListener('mousewheel', mouseWheelResize, false);
        }

        if (evt.srcElement.tagName == "IMG") {
            evt.srcElement.className = evt.srcElement.className.replace(" x-htmleditor-imageupload-bordeResize", "").replace(" x-htmleditor-imageupload-bordeSelect", "");
            if(me.wheelResize || me.dragResize)evt.srcElement.className += " x-htmleditor-imageupload-bordeResize";
			else evt.srcElement.className += " x-htmleditor-imageupload-bordeSelect";
			
            if (Ext.isWebKit && me.dragResize) evt.srcElement.addEventListener('drag', mouseDragResize, false);
            if(me.wheelResize)evt.srcElement.addEventListener('mousewheel', mouseWheelResize, false);

            // select image. On safari if we copy and paste the image, class attrs are converted to inline styles. It's a browser bug.
            if (Ext.isWebKit) {
                var sel = window.getSelection ? window.getSelection() : window.document.selection;
                sel.setBaseAndExtent(evt.srcElement, 0, evt.srcElement, 1);
            }
        }
    },
    initialize: function () {

        // Weird. In gecko browsers, if the user clicks directly on a photo, it loses the focus the first time.
        // focusing on the editor we avoid this problem
        if (Ext.isGecko) this.cmp.focus();

        // little hack to allow image drag, and mousewheel resizing on webkit browsers and mousewheel in opera browser.
        if ((Ext.isWebKit || Ext.isOpera)) {
            var me = this;
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

            // to add resize listener on iframes document
            iframe = document.getElementById(me.cmp.iframeEl.dom.id);
            iframe.contentWindow.document.body.addEventListener('click', function (evt) {
                me._webKitResize(evt, iframe.contentWindow.document, iframe.contentWindow)
            }, false);
        }
    },
    onRender: function () {
        this.cmp.getToolbar().add([{
            iconCls: 'x-htmleditor-imageupload',
            handler: this._subirImagen,
            scope: this,
            tooltip: this.t('Insert/Edit Image'),
            overflowText: this.t('Insert/Edit Image')
        }]);

    },
    _subirImagen: function () {

        var cmp = this.cmp;
        var doc = this.cmp.getDoc();
        var win = this.cmp.win;
        var sel = "";
        var range = "";
        var image = "";

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

        // to make the things easier, if the user has an image selected when he presses the image upload button, I mark it with a custom attr "html_imgediting".
        // afterwards, if the user presses the ok button I just need to find the image with that attr, and replace it with the new one.
        if (Ext.isIE && sel.type == "Control") {
            image = range.item(0);
            range.item(0).setAttribute('html_imgediting', '1');
        } else if (range.startContainer == range.endContainer) {
            if (range.endOffset - range.startOffset < 2) {
                if (range.startContainer.hasChildNodes()) image = range.startContainer.childNodes[range.startOffset];
                if (image) range.startContainer.childNodes[range.startOffset].setAttribute('html_imgediting', '1');
            }
        }

        this.uploadDialog = Ext.create('Ext.ux.form.HtmlEditor.ImageDialog', {
            lang: this.lang,
            t: this.t,
            submitUrl: this.submitUrl,
			managerUrl: this.managerUrl,
            iframeDoc: doc,
            imageToEdit: image,
			pageSize: this.pageSize
        });

        this.uploadDialog.on('imageloaded', function () {
            var newImage = this.getImage();

            // if it's an edited image, we have to replace it with the new values
            if (image != "") {
                var imgs = doc.body.getElementsByTagName("IMG");
                for (i = 0; i < imgs.length; i++) {
                    if (imgs[i].getAttribute('html_imgediting') == 1) {
                        if (nonIeBrowser) {
                            imgs[i].parentNode.replaceChild(newImage, imgs[i]);
                        } else if (ieBrowser) {
                            imgs[i].outerHTML = newImage.outerHTML;

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
			
			//cmp.insertAtCursor(newImage.outerHTML);
			
            this.imageToEdit = "";
            this.close();
        });

        this.uploadDialog.loadImageDetails();
        this.uploadDialog.show();
    }
});

Ext.define('Ext.ux.form.HtmlEditor.ImageDialog', {
    extend: 'Ext.window.Window',
    lang: null,
    lang: null,
    t: null,
    submitUrl: null,
	managerUrl:null,
    iframeDoc: null,
	pageSize:4,
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
            panel.down('#src').focus();
        },
        close: function (panel) {
            // if we were editing a image we have to delete the custom attr
            if (panel.imageToEdit) {
                var imgs = panel.iframeDoc.body.getElementsByTagName("IMG");
                for (i = 0; i < imgs.length; i++) {
                    if (imgs[i].getAttribute('html_imgediting') == 1) {
                        imgs[i].removeAttribute('html_imgediting');
                        break;
                    }
                }
            }
        }
    },
    initComponent: function () {
        var me = this;

		Ext.define('User', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'name', type: 'string'},
				{name: 'fullname', type: 'string'},
				{name: 'src',  type: 'string'}
			]
		});

		var imageStore = Ext.create('Ext.data.Store', {
			model: 'User',
			proxy: {
				type: 'ajax',
				url : me.managerUrl,
				extraParams: {
                    action: 'imagesList'
                },
				reader: {
					type: 'json',
					root: 'data'
				}
			},
			autoLoad: false,
			pageSize:me.pageSize
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
            itemId: 'imageUploadForm',
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
                items: [
				{
					xtype: 'combobox',
					itemId: 'src',
					queryMode: 'local',
					fieldLabel: 'Url',
					labelWidth:50,
					width: 326,
					margin: '0 4 0 0',
					editable: true,
					allowBlank: true,
					emptyText: '',
					value: '',
					store: imageStore,
					displayField: 'src',
					valueField: 'src',
					listConfig: {
						loadingText: 'Searching...',
						emptyText: 'No matching posts found.',

						// Custom rendering template for each item
						getInnerTpl: function() {
							return '<img class="x-htmleditor-imageupload-thumb" src="{src}" /><div class="x-htmleditor-imageupload-name">{name}</div><div img_fullname="{fullname}" class="x-htmleditor-imageupload-delete"></div>';
						},
						listeners: {
							afterrender: function (combo, options)
							{
								combo.store.load();
							},
							select: function()
							{
								var combo = me.down('#src');
								var value = combo.getValue();
								me.down('form').getForm().reset();
								combo.setRawValue(value);
							},
							el: {
								click: {
									delegate: 'div.x-htmleditor-imageupload-delete',
									fn: function(ev, div) {						
										Ext.Msg.show(
										{
											title: me.t('Confirmation'),
											msg: me.t('Are you sure you want to delete this image?'),
											buttons: Ext.Msg.YESNO,
											closable: false,
											fn: function (btn)
											{
												if (btn == 'yes')
												{
													Ext.Ajax.request(
													{
														url: me.managerUrl,
														method: 'POST',
														params: {'action': 'delete','image':div.getAttribute('img_fullname')},
														success: function (fp, o)
														{
															var combo = me.down('#src');
															combo.setValue('');
															combo.store.load(combo.store.lastOptions);
															me.down('form').getForm().reset();													
														},
														failure: function(form, action)
														{
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
				},{
                    xtype: 'filefield',
                    buttonOnly: true,
                    itemId: 'photo-path',
                    name: 'photo-path',
                    value: '',
                    buttonText: me.t('Upload Image...'),
                    listeners: {
                        change: function () {
                            var form = this.up('form').getForm();
                            if (form.isValid()) {
                                form.submit({
                                    url: me.submitUrl+'?action=upload',
                                    waitMsg: me.t('Uploading your photo...'),
                                    success: function (fp, o) {
                                        Ext.Msg.alert('Success', 'Your photo has been uploaded.');
										var combo = me.down('#src');
                                        combo.setRawValue(o.result.data['src']);
										combo.store.load(combo.store.lastOptions);
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
                    defaults: {
                        anchor: '100%',
                        labelWidth: 72
                    },
                    items: [{
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
                            xtype: 'numberfield',
                            fieldLabel: me.t('Width'),
                            itemId: 'width'
                        }, {
                            xtype: 'combobox',
                            itemId: 'widthUnits',
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
                            itemId: 'height'
                        }, {
                            xtype: 'combobox',
                            itemId: 'heightUnits',
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
                        }]
                    }, {
                        xtype: 'combobox',
                        itemId: 'float',
                        queryMode: 'local',
                        editable: false,
                        allowBlank: false,
                        fieldLabel: me.t('Align'),
                        value: 'left',
                        store: alignStore,
                        displayField: 'name',
                        valueField: 'value'
                    }]
                }, {
                    xtype: 'fieldset',
                    title: me.t('Style'),
                    collapsible: true,
                    layout: 'anchor',
                    collapsed: true,
                    items: [{
                        xtype: 'combobox',
                        itemId: 'display',
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
                        itemId: 'title',
                        labelWidth: 72,
                        anchor: '100%',
                        fieldLabel: me.t('Title')
                    }, {
                        xtype: 'textfield',
                        itemId: 'className',
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
                            itemId: 'paddingTop'
                        }, {
                            xtype: 'combobox',
                            itemId: 'paddingTopUnits',
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
                            itemId: 'paddingRight'
                        }, {
                            xtype: 'combobox',
                            itemId: 'paddingRightUnits',
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
                            itemId: 'paddingBottom'
                        }, {
                            xtype: 'combobox',
                            itemId: 'paddingBottomUnits',
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
                            itemId: 'paddingLeft'
                        }, {
                            xtype: 'combobox',
                            itemId: 'paddingLeftUnits',
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
                            itemId: 'marginTop'
                        }, {
                            xtype: 'combobox',
                            itemId: 'marginTopUnits',
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
                            itemId: 'marginRight'
                        }, {
                            xtype: 'combobox',
                            itemId: 'marginRightUnits',
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
                            itemId: 'marginBottom'
                        }, {
                            xtype: 'combobox',
                            itemId: 'marginBottomUnits',
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
                            itemId: 'marginLeft'
                        }, {
                            xtype: 'combobox',
                            itemId: 'marginLeftUnits',
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
                    text: 'Cancelar',
                    handler: me.close,
                    scope: me
                }, {
                    xtype: 'button',
                    style: {
                        'float': 'right',
                        'margin-right': '8px'
                    },
                    text: 'Aceptar',
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

            this.down('#fieldOptions').expand();

            this.down('#src').setRawValue(image.src);
            
			if (image.style) {
                if (Ext.isIE) {
                    this.down('#float').setValue(image.style.styleFloat ? image.style.styleFloat : 'none');
                } else {
                    this.down('#float').setValue(image.style.cssFloat ? image.style.cssFloat : 'none');
                }
                this.down('#display').setValue(image.style.display ? image.style.display : '');
                this.down('#width').setValue(image.style.width ? image.style.width.replace(/[^\d.]/g, "") : image.width);
                this.down('#height').setValue(image.style.height ? image.style.height.replace(/[^\d.]/g, "") : image.height);
                this.down('#widthUnits').setValue(image.style.width ? image.style.width.replace(/[\d.]/g, "") : 'px');
                this.down('#heightUnits').setValue(image.style.height ? image.style.height.replace(/[\d.]/g, "") : 'px');
                this.down('#paddingTop').setValue(image.style.paddingTop ? image.style.paddingTop.replace(/[^\d.]/g, "") : '');
                this.down('#paddingTopUnits').setValue(image.style.paddingTop ? image.style.paddingTop.replace(/[\d.]/g, "") : 'px');
                this.down('#paddingLeft').setValue(image.style.paddingLeft ? image.style.paddingLeft.replace(/[^\d.]/g, "") : '');
                this.down('#paddingLeftUnits').setValue(image.style.paddingLeft ? image.style.paddingLeft.replace(/[\d.]/g, "") : 'px');
                this.down('#paddingBottom').setValue(image.style.paddingBottom ? image.style.paddingBottom.replace(/[^\d.]/g, "") : '');
                this.down('#paddingBottomUnits').setValue(image.style.paddingBottom ? image.style.paddingBottom.replace(/[\d.]/g, "") : 'px');
                this.down('#paddingRight').setValue(image.style.paddingRight ? image.style.paddingRight.replace(/[^\d.]/g, "") : '');
                this.down('#paddingRightUnits').setValue(image.style.paddingRight ? image.style.paddingRight.replace(/[\d.]/g, "") : 'px');
                this.down('#marginTop').setValue(image.style.marginTop ? image.style.marginTop.replace(/[^\d.]/g, "") : '');
                this.down('#marginTopUnits').setValue(image.style.marginTop ? image.style.marginTop.replace(/[\d.]/g, "") : 'px');
                this.down('#marginLeft').setValue(image.style.marginLeft ? image.style.marginLeft.replace(/[^\d.]/g, "") : '');
                this.down('#marginLeftUnits').setValue(image.style.marginLeft ? image.style.marginLeft.replace(/[\d.]/g, "") : 'px');
                this.down('#marginBottom').setValue(image.style.marginBottom ? image.style.marginBottom.replace(/[^\d.]/g, "") : '');
                this.down('#marginBottomUnits').setValue(image.style.marginBottom ? image.style.marginBottom.replace(/[\d.]/g, "") : 'px');
                this.down('#marginRight').setValue(image.style.marginRight ? image.style.marginRight.replace(/[^\d.]/g, "") : '');
                this.down('#marginRightUnits').setValue(image.style.marginRight ? image.style.marginRight.replace(/[\d.]/g, "") : 'px');
            }
            this.down('#title').setValue(image.title);
            this.down('#className').setValue(image.className.replace("x-htmleditor-imageupload-bordeResize", "").replace("x-htmleditor-imageupload-bordeSelect", ""));
        }
    },
    getImage: function () {
        // we have to create the node on iframe's document or Opera will explode!
        var image = this.iframeDoc.createElement("img");

        var title = this.down('#title').getValue();
        var width = this.down('#width').getValue();
        var height = this.down('#height').getValue();
        var paddingTop = this.down('#paddingTop').getValue();
        var paddingBottom = this.down('#paddingBottom').getValue();
        var paddingLeft = this.down('#paddingLeft').getValue();
        var paddingRight = this.down('#paddingRight').getValue();
        var marginTop = this.down('#marginTop').getValue();
        var marginBottom = this.down('#marginBottom').getValue();
        var marginLeft = this.down('#marginLeft').getValue();
        var marginRight = this.down('#marginRight').getValue();
        var className = this.down('#className').getValue();
        var cssFloat = this.down('#float').getValue();
        var display = this.down('#display').getValue();

        // set image attrs
        image.setAttribute('src', this.down('#src').getValue());
        if (title) image.setAttribute('title', title);
        if (className) image.className = className;
        if (display) image.style.display = display;
        if (width) image.style.width = width + this.down('#widthUnits').getValue();
        if (height) image.style.height = height + this.down('#heightUnits').getValue();
        if (paddingTop) image.style.paddingTop = paddingTop + this.down('#paddingTopUnits').getValue();
        if (paddingBottom) image.style.paddingBottom = paddingBottom + this.down('#paddingBottomUnits').getValue();
        if (paddingLeft) image.style.paddingLeft = paddingLeft + this.down('#paddingLeftUnits').getValue();
        if (paddingRight) image.style.paddingRight = paddingRight + this.down('#paddingRightUnits').getValue();
        if (marginTop) image.style.marginTop = marginTop + this.down('#marginTopUnits').getValue();
        if (marginBottom) image.style.marginBottom = marginBottom + this.down('#marginBottomUnits').getValue();
        if (marginLeft) image.style.marginLeft = marginLeft + this.down('#marginLeftUnits').getValue();
        if (marginRight) image.style.marginRight = marginRight + this.down('#marginRightUnits').getValue();
        if (cssFloat != 'none') {
            if (Ext.isIE) {
                image.style.styleFloat = cssFloat;
            } else image.style.cssFloat = cssFloat;
        }

        //internet explorer add this two attrs, and we dont need them
        image.removeAttribute("width");
        image.removeAttribute("height");

        return image;
    }
});