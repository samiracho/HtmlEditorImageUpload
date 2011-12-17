<?php

// change these parameters to fit your server config
$allowedFormats    = ".jpg,.jpeg,.gif,.png";								// Allowed image formats
$maxSize           = "1024000"; 											// Max image size. 10485760 = 10MB
$imagesPath        = "uploads/"; 											// path where the files will be uploaded to the server
$imagesThumbsPath  = "uploads/thumbs/"; 											// path where the image thumbs will be uploaded to the server
$imagesTumbsUrl    = "http://www.asociacionhispanosiriacv.com/imageuploadPlugin2/uploads/thumbs/";
$imagesUrl         = "http://www.asociacionhispanosiriacv.com/imageuploadPlugin2/uploads/"; 	// url to the images
//$imagesTumbsUrl    = "http://localhost/HtmlEditorImageUpload/uploads/thumbs/";
//$imagesUrl         = "http://localhost/HtmlEditorImageUpload/uploads/"; 	// url to the images
$createThumbnails  = true;

if(isset($_REQUEST['action']))
{
	switch($_REQUEST['action'])
	{
		case 'upload':		
			print_r( json_encode( uploadHtmlEditorImage($allowedFormats,$maxSize,$imagesPath,$imagesUrl,$createThumbnails,$imagesTumbsUrl,$imagesThumbsPath) ) );
		break;
		
		case 'imagesList':
			$limit         = isset($_REQUEST["limit"])?intval($_REQUEST["limit"]):10;
			$start         = isset($_REQUEST["start"])?intval($_REQUEST["start"]):0;
			$query         = isset($_REQUEST["query"])?$_REQUEST["query"]:0;
			print_r(json_encode( getImages($imagesPath, $imagesUrl,$imagesTumbsUrl,$imagesThumbsPath, $allowedFormats, $start, $limit, $query) ));
		break;
		
		case 'delete':
			$image         = isset($_REQUEST["image"]) ? stripslashes($_REQUEST["image"]):"";
			print_r( json_encode( deleteImage($imagesPath,$imagesThumbsPath, $image) ));
		break;
	}
}

function uploadHtmlEditorImage($allowedFormats,$maxSize,$imagesPath,$imagesUrl,$createThumbnails=false,$imagesTumbsUrl,$imagesThumbsPath)
{	
	global $_FILES;
	$result = array();
	
	// quitamos caracteres extraños
	$nombreArchivo = preg_replace('/[^(\x20-\x7F)]*/','', $_FILES['photo-path']['name']);
	
	// extensión del archivo
	$ext           =  strtolower( substr($nombreArchivo, strpos($nombreArchivo,'.'), strlen($nombreArchivo)-1) );

	if(!in_array($ext,explode(',', $allowedFormats)))
	{
		$result= array(
            'success'	=> false,
            'message'	=> 'Error',
            'data'		=> '',
			'total'		=> '0',
			'errors'	=> 'The file you attempted to upload is not allowed.'
        );
		return $result;
	}

	/*while (file_exists($imagesPath.$nombreArchivo)) {
		$prefijo       = substr(md5(uniqid(rand())),0,6);
		$nombreArchivo = $prefijo.'_'.$nombreArchivo;
	}*/

	if(filesize($_FILES['photo-path']['tmp_name']) > $maxSize)
	{
		$result= array(
            'success'	=> false,
            'message'	=> 'Error',
            'data'		=> '',
			'total'		=> '0',
			'errors'	=> 'The file you attempted to upload is too large.'
        );
		return $result;
	}
	
	// Check if we can upload to the specified path, if not DIE and inform the user.
	if(!is_writable($imagesPath))
	{
		$result= array(
            'success'	=> false,
            'message'	=> 'Error',
            'data'		=> '',
			'total'		=> '0',
			'errors'	=> 'You cannot upload to the specified directory: '.$imagesPath.', please CHMOD it to 777 or check permissions'
        );
		return $result;
	}

	if(move_uploaded_file($_FILES['photo-path']['tmp_name'],$imagesPath.$nombreArchivo))
	{		
		if($createThumbnails && $ext!=".gif")
		{
			// create the thumbnail
			require_once 'easyphpthumbnail.class.php';
				
			$thumb = new easyphpthumbnail;

			// Set thumbsize - automatic resize for landscape or portrait
			$thumb -> Thumbsize = 64;
			$thumb -> Square = true;
			$thumb -> Cropimage = array(3,0,0,0,0,0);
			//$thumb -> Backgroundcolor = '#D0DEEE';
			//$thumb -> Shadow = true;
			$thumb -> Thumblocation = $imagesThumbsPath;
			$thumb -> Thumbsaveas = 'jpg';
			$thumb -> Createthumb($imagesPath.$nombreArchivo,'file');
		}
		
		$result= array(
            'success'	=> true,
            'message'	=> 'Image Uploaded Successfully',
            'data'		=> array('src'=>$imagesUrl.$nombreArchivo),
			'total'		=> '1',
			'errors'	=> ''
        );
	}
	else
	{
		$result= array(
            'success'	=> false,
            'message'	=> 'Error',
            'data'		=> '',
			'total'		=> '0',
			'errors'	=> 'Error Uploading Image'
        );
	}
	return $result;
}

function deleteImage($imagesPath,$imagesThumbsPath, $image = null)
{
	if(file_exists($imagesPath.$image))
	{
		// remove image
		unlink($imagesPath.$image);
		 
		// remove thumbnail if exists
		if(file_exists($imagesThumbsPath.$image))unlink($imagesThumbsPath.$image);
		
		return array(
			'success'	=> true,
			'message'	=> 'Success',
			'data'		=> '',
			'total'		=> 1,
			'errors'	=> ''
		);
	}
	else
	{
		return array(
			'success'	=> false,
			'message'	=> 'Error',
			'data'		=> '',
			'total'		=> 0,
			'errors'	=> 'Delete Operation Failed'
		);
	}
}

function getImages($imagesPath, $imagesUrl,$imagesTumbsUrl,$imagesThumbsPath, $allowedFormats, $start = 0, $limit = 10,$query ="")
{
	// array to hold return value
	$results = array();
	
	$handler = opendir($imagesPath);

    // open directory and walk through the filenames
    while ($file = readdir($handler)) {
	
		// extensión del archivo
		$ext =  strtolower( substr($file, strpos($file,'.'), strlen($file)-1) );

		if(in_array($ext,explode(',', $allowedFormats)))
		{		
			$resume = strlen ( $file ) > 18 ?  substr($file,0, 12).'...' : $file;
			if ($file != "." && $file != "..") {
				
				if( $query == "" || ($query != "" && stripos($file,$query)!== false) ){
					
					$thumbSrc = file_exists($imagesThumbsPath.$file) ? $imagesTumbsUrl.$file : $imagesUrl.$file;
					$results[] = array('fullname'=>$file,'name'=>$resume,'src'=>$imagesUrl.$file,'thumbSrc'=>$thumbSrc);
				}
			}
		}
    }
	
	return array(
		'success'	=> true,
		'message'	=> 'Success',
		'data'		=> $output = array_slice($results, $start, $limit),
		'total'		=> count($results),
		'errors'	=> ''
    );
}

?>