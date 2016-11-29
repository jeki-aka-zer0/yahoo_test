/**
 * Main script
 * https://javascriptobfuscator.com/Javascript-Obfuscator.aspx
 *
 * @author zer0 <zer0.stat@mail.ru>
 * @link https://github.com/jeki-aka-zer0
 * @date 29.11.16
 */

function MyApi(){
	var
		self = this;

	/**
	 * init app
	 */
	this.init = function(){
		$('HTML').addClass('js');
	};
}

var myApi = new MyApi();

$(function(){
	myApi.init();
});