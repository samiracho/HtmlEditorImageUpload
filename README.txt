 * HtmlEditorImageUpload plugin for Ext htmlEditor
 *
 * Adds a button to upload/insert/edit images
 *
 * @author    Sami Racho
 * @date      December 2011
 * @version   0.3
 *
 * @license Ext.ux.form.HtmlEditor.imageUpload is licensed under the terms of
 * the Open Source LGPL 3.0 license.  Commercial use is permitted to the extent
 * that the code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 * 
 * License details: http://www.gnu.org/licenses/lgpl.html


* About:
HtmlEditorImageUpload is a plugin for the ExtJS 4 htmleditor field who provides an easy way to insert and edit images 


* Example Usage:

	xtype: 'htmleditor',
		plugins: [new Ext.create('Ext.ux.form.HtmlEditor.imageUpload', {dragResize:false,dragWheel:false})],
        height: 400,
        style: 'background-color: white;',

		
* Plugin Parameters:

lang:
	Associative array with all the dialog strings
	For example to translate the plugin to spanish you'll have to add this array to the plugin options config

	lang: {
		'Display': 'Mostrar','By Default': 'Por Defecto','Inline': 'En línea con el texto','Block': 'En una línea a parte',
		'Insert/Edit Image': 'Insertar/Editar Imagen','Upload Image...': 'Subir Imagen...','Uploading your photo...': 'Subiendo su imagen...',
		'Error': 'Error','Width': 'Ancho','Height': 'Alto','Align': 'Alineación','Title': 'Título','Class': 'Clase','Padding': 'Relleno','Margin': 'Margen',
		'Top': 'Superior','Bottom': 'Inferior','Right': 'Derecha','Left': 'Izquierda','None': 'Ninguna','Size & Details': 'Tamaño y Detalles',
		'More Options': 'Más Opciones','Style' : 'Estilo','OK' : 'Aceptar','Cancel': 'Cancelar','Delete Image':'Borrar Imagen',
		'Confirmation':'Confirmación','Are you sure you want to delete this image?':'¿Está seguro de que desea eliminar esta imagen?','Your photo has been uploaded.':'Su imagen ha sido subida.'
	}


submitUrl:
	Url where the file field will post the image to upload. A simple php was written to do the job "htmlEditorImageUpload.php".
	If you want to use the provided php scrip, make sure you modify the following variables 
	$imagesPath must point to the path where the images will be uploaded. For example on a windows Wamp installation will be something like "c:\\wamp\\www\\imageuploadPlugin\\uploads\\"
	$imagesUrl must point to the http path where the images will be accesible. For example on a Windows Wamp installation will be like "http:\\localhost\imageuploadPlugin\uploads\"

	If you want to write your own, the file field name posted is 'photo-path'.
	The script must return a json response with this format:

	If file upload is successfull
	{"success":true,"message":"Image Uploaded Successfully","data":{"src":"http:\/\/yoursite.com\/imageuploadPlugin\/uploads\/ajpg.png"},"total":"1","errors":""}

	Upload failure example
	{"success":false,"message":"Error","data":"","total":"0","errors":"The file you attempted to upload is too large."}

disableServerSideEdit:
	Enables/disables server side image editing buttons
	
disableDelete:	
	Enables/disables server side image editing
	
disableStyling: 
	Enables/disables image css styling.
	
managerUrl:
	Url to get the images folder list and delete them.
	The images list will be a json string with the following format
	{"success":true,"message":"Success","data":[{"fullname":"images (1).jpg","name":"images (1).jpg...","src":"http:\/\/www.asociacionhispanosiriacv.com\/imageuploadPlugin2\/uploads\/images (1).jpg"},{"fullname":"Sunset.jpg","name":"Sunset.jpg..."

pageSize:
	Number of results to show on image list
	
dragResize:
	By default is true, it allows image drag resize on WebKit browsers

wheelResize:
	By default is true, it allows image drag resize on WebKit browsers and Opera

iframeCss:
	Path to the css file that will be applied to the htmleditor iframe. By default is css/iframe_css
	It's important to do not merge this css with other CSS files, because it will be applied to the htmleditor 
	iframe head. If more css rules are included, it can suffer undesired effects