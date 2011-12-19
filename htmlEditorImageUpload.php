<?php
require_once 'thumbnailer/ThumbLib.inc.php';
			
// change these parameters to fit your server config
$allowedFormats    = "jpg,jpeg,gif,png";								// Allowed image formats
$maxSize           = "102400"; 											// Max image size. 10485760 = 10MB
$imagesPath        = "uploads/"; 											// path where the files will be uploaded to the server
$imagesThumbsPath  = "uploads/thumbs/"; 											// path where the image thumbs will be uploaded to the server
$imagesTumbsUrl    = "http://www.racho.es/examples/HtmlEditorImageUpload/uploads/thumbs/";
$imagesUrl         = "http://www.racho.es/examples/HtmlEditorImageUpload/uploads/"; 	// url to the images
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
		
		case 'crop':
		
			$imageSrc      = isset($_REQUEST["image"])?($_REQUEST["image"]):'';
			$width         = isset($_REQUEST["width"])?intval($_REQUEST["width"]):0;
			$height        = isset($_REQUEST["height"])?intval($_REQUEST["height"]):0;
			$offsetLeft    = isset($_REQUEST["offsetLeft"])?intval($_REQUEST["offsetLeft"]):0;
			$offsetTop     = isset($_REQUEST["offsetTop"])?intval($_REQUEST["offsetTop"]):0;
			$zoom          = isset($_REQUEST["zoom"])?intval($_REQUEST["zoom"]):1;
			print_r( json_encode( cropImage($imagesPath,$imagesThumbsPath,$imagesUrl,$imagesTumbsUrl,$imageSrc,$width,$height,$offsetLeft,$offsetTop, $zoom, $allowedFormats) ) );
		break;
		
		case 'rotate':		
			$imageSrc      = isset($_REQUEST["image"])?($_REQUEST["image"]):'';
			print_r( json_encode( rotateImage($imagesPath,$imagesThumbsPath,$imagesUrl,$imageSrc) ) );
		break;
		
		case 'resize':
			$width         = isset($_REQUEST["width"])?intval($_REQUEST["width"]):0;
			$height        = isset($_REQUEST["height"])?intval($_REQUEST["height"]):0;		
			$imageSrc      = isset($_REQUEST["image"])?($_REQUEST["image"]):'';
			print_r( json_encode( resizeImage($imagesPath,$imagesThumbsPath,$imagesUrl,$imageSrc,$width,$height) ) );
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

function checkAllowedFormats($imageName, $allowedFormats)
{
	// quitamos caracteres extraños
	$imageName = preg_replace('/[^(\x20-\x7F)]*/','', $imageName);
	
	// extensión del archivo
	$ext       =  strtolower( substr($imageName, strpos($imageName,'.')+1, strlen($imageName)-1) );

	if(!in_array($ext,explode(',', $allowedFormats))) return false;
	else return true;
}

function uploadHtmlEditorImage($allowedFormats,$maxSize,$imagesPath,$imagesUrl,$createThumbnails=false,$imagesTumbsUrl,$imagesThumbsPath)
{	
	global $_FILES;
	$result = array();
	
	if(!checkAllowedFormats($_FILES['photo-path']['name'], $allowedFormats))
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

	$nombreArchivo = preg_replace('/[^(\x20-\x7F)]*/','', $_FILES['photo-path']['name']);
	$ext           =  strtolower( substr($nombreArchivo, strpos($nombreArchivo,'.')+1, strlen($nombreArchivo)-1) );
	
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
		if($createThumbnails)
		{			
			$thumb = PhpThumbFactory::create($imagesPath.$nombreArchivo);
			$thumb->adaptiveResize(64, 64);
			$thumb->save($imagesThumbsPath.$nombreArchivo);
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

function cropImage($imagesPath,$imagesThumbsPath,$imagesUrl,$imagesThumbsUrl,$imageSrc,$width,$height,$offsetLeft,$offsetTop, $zoom, $allowedFormats)
{
	$imageName = preg_replace('/[^(\x20-\x7F)]*/','', basename($imageSrc));
		
	$zoom      = $zoom/100;
	$left      = $offsetLeft > 0 ? round($offsetLeft/$zoom) : 0;
	$width     = round($width/$zoom);		
	$top       = $offsetTop > 0 ? round($offsetTop/$zoom) : 0;
	$height    = round($height/$zoom);
	
	try
	{
		// make the cropped image
		$thumb = PhpThumbFactory::create($imagesPath.$imageName);
		$thumb->crop($left, $top, $width, $height);
		$thumb->save($imagesPath.$imageName);
		
		// make the thumbnail for the cropped image
		$thumb->adaptiveResize(64, 64);
		$thumb->save($imagesThumbsPath.$imageName);
		
		return array(
			'success'	=> true,
			'message'	=> 'Success',
			'data'		=>  array('src'=>$imagesUrl.$imageName),
			'total'		=> 1,
			'errors'	=> ''
		);
	}
	catch (Exception $e)
	{
		return array(
			'success'	=> false,
			'message'	=> 'Error',
			'data'		=>  'Error with rotate operation.'.$e,
			'total'		=> 1,
			'errors'	=> ''
		);
	}
}

function rotateImage($imagesPath,$imagesThumbsPath,$imagesUrl,$imageSrc)
{
	$imageName = preg_replace('/[^(\x20-\x7F)]*/','', basename($imageSrc));
	
	try
	{
		// make the cropped image
		$thumb = PhpThumbFactory::create($imagesPath.$imageName);
		$thumb->rotateImageNDegrees(-90);
		$thumb->save($imagesPath.$imageName);
		
		// make the thumbnail for the cropped image
		$thumb->adaptiveResize(64, 64);
		$thumb->save($imagesThumbsPath.$imageName);
		
		return array(
			'success'	=> true,
			'message'	=> 'Success',
			'data'		=>  array('src'=>$imagesUrl.$imageName),
			'total'		=> 1,
			'errors'	=> ''
		);
	}
	catch (Exception $e)
	{
		return array(
			'success'	=> false,
			'message'	=> 'Error',
			'data'		=>  'Error with rotate operation.'.$e,
			'total'		=> 1,
			'errors'	=> ''
		);
	}
}

function resizeImage($imagesPath,$imagesThumbsPath,$imagesUrl,$imageSrc, $width, $height)
{
	$imageName = preg_replace('/[^(\x20-\x7F)]*/','', basename($imageSrc));
	
	try
	{
		$thumb = PhpThumbFactory::create($imagesPath.$imageName, array('resizeUp' => true));
		$thumb->resize($width, $height);
		$thumb->save($imagesPath.$imageName);
		
		// make the thumbnail for the cropped image
		$thumb->adaptiveResize(64, 64);
		$thumb->save($imagesThumbsPath.$imageName);
		
		return array(
			'success'	=> true,
			'message'	=> 'Success',
			'data'		=>  array('src'=>$imagesUrl.$imageName),
			'total'		=> 1,
			'errors'	=> ''
		);
	}
	catch (Exception $e)
	{
		return array(
			'success'	=> false,
			'message'	=> 'Error',
			'data'		=>  'Error with rotate operation.'.$e,
			'total'		=> 1,
			'errors'	=> ''
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
		$ext =  strtolower( substr($file, strpos($file,'.')+1, strlen($file)-1) );

		if(in_array($ext,explode(',', $allowedFormats)))
		{		
			$resume = strlen ( $file ) > 18 ?  substr($file,0, 12).'...' : $file;
			if ($file != "." && $file != "..") {
				
				if( $query == "" || ($query != "" && stripos($file,$query)!== false) ){
					
					$thumbSrc = file_exists($imagesThumbsPath.$file) ? $imagesTumbsUrl.$file : $imagesUrl.$file;
					$thumbSrc = strpos($thumbSrc, "https://") ? $thumbSrc : $thumbSrc.'?'.rand(1, 10000);
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