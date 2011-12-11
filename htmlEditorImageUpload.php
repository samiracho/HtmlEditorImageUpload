<?php

// change these parameters to fit your server config
$allowedFormats = ".jpg,.jpeg,.gif,.png";								// Allowed image formats
$maxSize        = "102400"; 											// Max image size. 10485760 = 10MB
$imagesPath     = "uploads/"; 											// path where the files will be uploaded to the server
$imagesUrl      = "http://www.asociacionhispanosiriacv.com/imageuploadPlugin2/uploads/"; 	// url to the images


if(isset($_REQUEST['action']))
{
	switch($_REQUEST['action'])
	{
		case 'upload':		
			print_r( json_encode( uploadHtmlEditorImage($allowedFormats,$maxSize,$imagesPath,$imagesUrl) ) );
		break;
		
		case 'imagesList':
			$limit         = isset($_REQUEST["limit"])?intval($_REQUEST["limit"]):10;
			$start         = isset($_REQUEST["start"])?intval($_REQUEST["start"]):0;
			print_r(json_encode( getImages($imagesPath, $imagesUrl, $allowedFormats, $start, $limit) ));
		break;
		
		case 'delete':
			$image         = isset($_REQUEST["image"]) ? stripslashes($_REQUEST["image"]):"";
			print_r( json_encode( deleteImage($imagesPath, $image) ));
		break;
	}
}

function uploadHtmlEditorImage($allowedFormats,$maxSize,$imagesPath,$imagesUrl)
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

function deleteImage($imagesPath, $image = null)
{
	if(file_exists($imagesPath.$image) && unlink($imagesPath.$image))
	{
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

function getImages($imagesPath, $imagesUrl, $allowedFormats, $start = 0, $limit = 10)
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
		  if ($file != "." && $file != "..") {
			$results[] = array('fullname'=>$file,'name'=>substr($file,0, 20).'...','src'=>$imagesUrl.$file);
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