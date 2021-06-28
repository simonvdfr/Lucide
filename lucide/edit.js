// @todo: mettre une barre loading et readonly qd save


// Type de navigateur
$.browser = {};
$.browser.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
$.browser.webkit = /webkit/.test(navigator.userAgent.toLowerCase());
$.browser.msie = /msie/.test(navigator.userAgent.toLowerCase());


/************** LANGUE **************/
lang = 'en';
translation = {};

// Fonction d'ajout d'une liste de traduction
add_translation = function(new_translation) {
	Object.keys(new_translation).forEach(function(i){
		translation[i] = new_translation[i]; 
		translation[i.toLowerCase()] = new_translation[i];// Lowercase les index de traduction
	});
}

// Traduction
add_translation({
	"Error" : {"fr" : "Erreur"},

	"Save" : {"fr" : "Enregistrer"},
	"The changes are not saved" : {"fr" : "Les modifications ne sont pas enregistrées"},

	"Paste something..." : {"fr" : "Collez quelque chose..."},
	"Upload file" : {"fr" : "Télécharger un fichier"},
	"Change the background image" : {"fr" : "Changer l'image de fond"},
	"This file format is not supported" : {"fr" : "Ce format de fichier n'est pas pris en charge"},	
	"Title" : {"fr" : "Titre"},	
	"Media Library" : {"fr" : "Bibliothèque des médias"},		
	"Icon Library" : {"fr" : "Bibliothèque d'icône"},		
	"See the source code" : {"fr" : "Voir le code source"},		
	"Anchor" : {"fr" : "Ancre"},		
	"Add Anchor" : {"fr" : "Ajouter une ancre"},		
	"Change Anchor" : {"fr" : "Modifier l'ancre"},		
	"Link" : {"fr" : "Lien"},		
	"Add Link" : {"fr" : "Ajouter le lien"},		
	"Change Link" : {"fr" : "Modifier le lien"},		
	"Open link in new window" : {"fr" : "Ouvre le lien dans une nouvelle fenêtre"},		
	"Destination URL" : {"fr" : "URL de destination"},	

	"Remove the link from the selection" : {"fr" : "Supprimer le lien de la sélection"},
	"Image caption" : {"fr" : "Légende de l'image"},		
	"Delete" : {"fr" : "Supprimer"},		
	"Add" : {"fr" : "Ajouter"},
	"Width" : {"fr" : "Largeur"},
	"Height" : {"fr" : "Hauteur"},
	"Optimize" : {"fr" : "Optimiser"},
	"Subtitle" : {"fr" : "Sous-titre"},

	"Add a module" : {"fr" : "Ajouter un module"},
	"Move" : {"fr" : "Déplacer"},
	"Remove" : {"fr" : "Supprimer"},

	"Image optimization" : {"fr" : "Optimisation des images"},
	"Resize" : {"fr" : "Redimensionner"},
	"Convert to" : {"fr" : "Convertir en"},
	"Compress" : {"fr" : "Compresser"},
	"Limit" : {"fr" : "Limite"},
	"Background" : {"fr" : "Fond"},
});

// Traduit un texte
__ = function(txt) {	
	if(typeof txt == 'object') {// Si l'argument txt est un tableau de traduction
		add_translation(txt);// On ajoute la traduction
		var txt = Object.keys(txt)[0];// On met la clé dans la variable
	}

	if(typeof translation[txt] !== 'undefined' && translation[txt][lang]) 
		return translation[txt][lang];	
	else 
		return txt;
}



/************** FONCTIONS DE SAUVEGARDE **************/

// Url en cours nettoyé
clean_url = function() {
	return location.protocol +'//'+ location.host + location.pathname + location.search;
}


// Rapatrie le contenu
get_content = function(content)
{
	// Supprime les index devant les class et id
	var content_array = content.replace(/\.|#/, '');

	data[content_array] = {};

	// Contenu des champs éditables
	$(document).find(content+" .editable").each(function() {
		// Si on est en mode pour voir le code source
		if($(this).hasClass("view-source")) var content_editable = $(this).text();
		else var content_editable = $(this).html();

		if($(this).html()) data[content_array][this.id] = content_editable;
	});
	
	// Contenu des images éditables
	$(document).find(content+" img.editable").each(function() {
		if($(this).attr("src")) data[content_array][$(this).closest("img.editable").attr("id")] = $(this).attr("src");
	});
	
	// Contenu des background images éditables
	$(document).find(content+" [data-bg]").each(function() {
		if($(this).attr("data-bg")) data[content_array][$(this).attr("data-id")] = $(this).attr("data-bg");
	});
		
	// Checkbox fa
	$(document).find(content+" .editable-checkbox").each(function() {
		if($(this).hasClass("fa-ok")) data[content_array][this.id] = true;					
	});

	// Contenu des select, input hidden, href éditables // content+" input, "+
	$(document).find(content+" .editable-select, "+content+" .editable-input, "+content+" .editable-href, "+content+" .editable-alt").each(function() {
		if($(this).attr("type") == "checkbox") data[content_array][this.id] = $(this).prop("checked");			
		else if($(this).val()) data[content_array][this.id] = $(this).val(); 
	});
}


// Sauvegarde les contenus
save = function() //callback
{
	// @todo: disable/unbind sur save pour dire que l'on est en train de sauvegarder
	
	// Fonction à exécuter avant la collect des datas
	$(before_data).each(function(key, funct){ funct(); });

	// Si image sélectionnée : raz propriétés image (sécurité pour ne pas enregistrer de ui-wrapper)
	if(memo_img) img_leave();

	// Animation sauvegarde en cours (loading)
	$("#save i").removeClass("fa-floppy").addClass("fa-spin fa-cog");

	data = {};
	
	data["nonce"] = $("#nonce").val();// Pour la signature du formulaire

	data["url"] = clean_url();// Url de la page en cours d'édition

	data["permalink"] = $("#admin-bar #permalink").val();// Permalink

	data["title"] = $("#admin-bar #title").val();// Titre de la page
	data["description"] = $("#admin-bar #description").val();// Description pour les serp

	//data["type"] = $("#admin-bar #type").val();// Type de contenu

	//data["tpl"] = $("#admin-bar #tpl").val();// Template

	// Robots 
	if($("#admin-bar #noindex").prop("checked")) data["robots"] = "noindex";
	if($("#admin-bar #nofollow").prop("checked")) 
		data["robots"] = 
			(data["robots"]?data["robots"]:"") +
			(data["robots"]?", ":"") +
			"nofollow";

	data["date-insert"] = $("#admin-bar #date-insert").val();// Date de création de la page
	

	get_content("body");// Contenu de la page


	if($("#admin-bar #og-image img").attr("src"))
	data["content"]["og-image"] = $("#admin-bar #og-image img").attr("src");// Image pour les réseaux sociaux


	// Fonction à exécuter avant la sauvegarde
	$(before_save).each(function(key, funct){ funct(); });

	// On sauvegarde en ajax les contenus éditables
	if(lucide == true)	
	$.ajax({
		type: "POST",
		url: path+"api/ajax.admin.php?mode=update",
		data: data
	})
	.done(function(html) {
		// Affichage/exécution du retour
		$("body").append(html);

		// Fonction à exécuter après la sauvegarde
		$(after_save).each(function(key, funct){ funct(); });
	})
	.fail(function() {
		error(__("Error"));
	});
}


// Changement d'état des boutons de sauvegarde
tosave = function() {	
	$("#save i").removeClass("fa-spin fa-cog").addClass("fa-floppy");// Affiche l'icône disant qu'il faut sauvegarder sur le bt save	
	$("#save").removeClass("saved").addClass("to-save");// Changement de la couleur de fond du bouton pour indiquer qu'il faut sauvegarder
}



/************** FONCTIONS DE MANIPULATION DES CONTENUS **************/

// Fonctions pour catcher la sélection
range_selects_single_node = function(range) {
	var start_node = range.startContainer;
	return start_node === range.endContainer && start_node.hasChildNodes() && range.endOffset === range.startOffset + 1;
}

selected_element = function(range) {
	if (range_selects_single_node(range))// La sélection comprend un seul élément
		return range.startContainer.childNodes[range.startOffset];
	else if (range.startContainer.nodeType === 3)// La sélection commence à l'intérieur d'un noeud de texte, donc obtenir son parent
		return range.startContainer.parentNode;
	else// La sélection commence à l'intérieur d'un élément
		return range.startContainer;
}


// Barre d'outil de mise en forme et de contenu
exec_tool = function(command, value, ui) {
	ui = ui || false;
	value = value || "";	
				
	// Sélectionne le contenu car on a perdu le focus en entrant dans les options
	if((command == "CreateLink" || command == "CreateAnchor" || command == "insertImage" || command == "insertIcon" || command == "insertHTML" || command == "insertText") && memo_selection && memo_range) {
		memo_selection.removeAllRanges();
		memo_selection.addRange(memo_range);		
	}
	
	if(command)
	{
		// Si icône
		if(command == "insertIcon") {
			command = "insertHTML";
			value = "<i class='fa'>&#x"+ value +";</i>";
		}


		// Si Ajout d'une ancre
		if(command == "CreateAnchor") { var command_source = command; command = "CreateLink"; }


		// Exécution de la commande
		document.execCommand(command, ui, value);
		

		// A sauvegarder	
		tosave();


		if(command_source == "CreateAnchor")
		{
			// On supprime le href et le déplace dans name
			$(memo_selection.anchorNode.parentElement).attr("name", $(memo_selection.anchorNode.parentElement).attr("href")).removeAttr("href");

			$("#txt-tool #anchor-option").hide("slide", 300);// Cache le menu d'option avec animation
		}
		else if(command == "CreateLink")
		{
			// Si Target = blank // @todo verif marche sous firefox ??
			if($("#target-blank").hasClass("checked")) memo_selection.anchorNode.parentElement.target = "_blank";
			else $(memo_node).removeAttr("target");

			// Si class bt
			if($("#class-bt").hasClass("checked")) memo_selection.anchorNode.parentElement.classList.add("bt");
			else $(memo_node).removeClass("bt");
			
			$("#txt-tool #link-option").hide("slide", 300);// Cache le menu d'option avec animation
		}
		else
			$("#txt-tool .option").hide();// Cache le menu d'option rapidement
	}

	$(memo_focus).focus();// On focus le contenu édité pour faire fonctionner onblur = close toolbox

	// Recrée une sélection en fonction des changements de la dom
	memo_selection = window.getSelection();
	memo_range = memo_selection.getRangeAt(0);
	memo_node = selected_element(memo_range);
}


// ANCHOR
// Menu avec les options d'ajout/modif d'ancre
anchor_option = function()
{		
	$("#unanchor").remove();// Supprime le bouton de supp d'anchor
	$("#txt-tool .option").hide();// Réinitialise le menu d'option

	var name = $(memo_node).closest('a').attr('name');// On récupère le href de la sélection en cours

	// Si lien
	if(name) 
	{
		// Bouton pour supp l'ancre //exec_tool('unanchor');
		$("#txt-tool #anchor-option").prepend("<a href=\"javascript:unanchor();void(0);\" id='unanchor'><i class='fa fa-cancel plt prt' title='"+ __("Remove the link from the selection") +"'></i></a>");

		$("#txt-tool #anchor-option #anchor").val(name);
		$("#txt-tool #anchor-option button span").text(__("Change Anchor"));
		$("#txt-tool #anchor-option button i").removeClass("fa-plus").addClass("fa-floppy");
	}
	else 
	{
		$("#txt-tool #anchor-option #anchor").val('');
		$("#txt-tool #anchor-option button span").text(__("Add Anchor"));
		$("#txt-tool #anchor-option button i").removeClass("fa-floppy").addClass("fa-plus");
	}
	
	$("#txt-tool #anchor-option").show("slide", 300);
}

// Supprime le lien autour
unanchor = function() 
{
	$(memo_node).contents().unwrap();
	$("#txt-tool #anchor-option").hide("slide", 300);

	$(memo_focus).focus();
}

// Edite ou ajoute l'ancre
anchor = function() 
{
	var anchor = $('#txt-tool .option #anchor').val();

	// Si ajout de lien
	if($("#txt-tool #anchor-option button i").hasClass("fa-plus")) 
		exec_tool('CreateAnchor', anchor)//insertHTML
	else
	{
		$(memo_node).attr("name", anchor);
		
		$("#txt-tool #anchor-option").hide("slide", 300);// Cache le menu d'option avec animation

		tosave();// A sauvegarder

		//@todo voir pour retrouver l'emplacement du focus une fois l'edition fini
	}
}


// LINK 
// Menu avec les options d'ajout/modif de lien
link_option = function()
{		
	$("#unlink").remove();// Supprime le bouton de supp de lien
	$("#txt-tool .option").hide();// Réinitialise le menu d'option
	$("#target-blank").removeClass("checked");// Réinitialise la colorisation du target _blank
	$("#class-bt").removeClass("checked");// Réinitialise la colorisation du class bt

	var href = $(memo_node).closest('a').attr('href');// On récupère le href de la sélection en cours

	// Si lien
	if(href) 
	{
		// Si target = blank
		if(memo_node.target == "_blank") $("#target-blank").addClass("checked");

		// Si class bt
		if($(memo_node).hasClass("bt")) $("#class-bt").addClass("checked");

		// Bouton pour supp le lien //exec_tool('unlink');
		$("#txt-tool #link-option").prepend("<a href=\"javascript:unlink();void(0);\" id='unlink'><i class='fa fa-cancel plt prt' title='"+ __("Remove the link from the selection") +"'></i></a>");

		$("#txt-tool #link-option #link").val(href);
		$("#txt-tool #link-option button span").text(__("Change Link"));
		$("#txt-tool #link-option button i").removeClass("fa-plus").addClass("fa-floppy");
	}
	else 
	{
		$("#txt-tool #link-option #link").val('');
		$("#txt-tool #link-option button span").text(__("Add Link"));
		$("#txt-tool #link-option button i").removeClass("fa-floppy").addClass("fa-plus");
	}
	
	// Affichage des options pour le lien
	// 300, car "slide" Crée un bug du chargement de l'autocomplete
	$("#txt-tool #link-option").show(300, function() {
		toolbox_height = $("#txt-tool").outerHeight();
		this_top_scroll = this_top - toolbox_height - 12;
		toolbox_position(this_top_scroll, this_left);
	});
}

// Supprime le lien autour
unlink = function() 
{
	$(memo_node).closest("a").contents().unwrap();
	$("#txt-tool #link-option").hide("slide", 300);

	$(memo_focus).focus();
}

// Edite ou ajoute le lien
link = function() 
{
	var link = $('#txt-tool .option #link').val();

	// Si ajout de lien
	if($("#txt-tool #link-option button i").hasClass("fa-plus")) 
		exec_tool('CreateLink', link)
	else
	{
		$(memo_node).closest("a").attr("href", link);

		// Si Target = blank
		if($("#target-blank").hasClass("checked")) $(memo_node).closest("a").attr("target","_blank");
		else $(memo_node).closest("a").removeAttr("target");	

		// Si class bt
		if($("#class-bt").hasClass("checked")) $(memo_node).closest("a").addClass("bt");
		else $(memo_node).closest("a").removeClass("bt");
		
		$("#txt-tool #link-option").hide("slide", 300);// Cache le menu d'option avec animation

		tosave();// A sauvegarder

		//@todo voir pour retrouver l'emplacement du focus une fois l'edition fini
	}
}


// Si target blank
target_blank = function(mode) {
	if(mode == true || !$("#target-blank").hasClass("checked")) $("#target-blank").addClass("checked");
	else $("#target-blank").removeClass("checked");
}

// Si class bt
class_bt = function(mode) {
	if(mode == true || !$("#class-bt").hasClass("checked")) $("#class-bt").addClass("checked");
	else $("#class-bt").removeClass("checked");
}

// Ajout/Suppression d'un element html
html_tool = function(html){
	// Si on est déjà dans un élément entouré du 'HTML' demandé : on le supp
	if($(memo_node).closest(html).length){
		$("#"+html).removeClass("checked");
		$(memo_node).replaceWith($(memo_node).html());
	}
	else {
		$("#"+html).addClass("checked");
		exec_tool('formatBlock', html);
	}
}

// Voir le code source
view_source = function(memo, force){

	// Si on est déjà en mode view source on remet en html
	if($(memo).hasClass("view-source")) 
	{
		$("#view-source").removeClass("checked");
		$(memo).removeClass("view-source").html($(memo).text());
	}
	else 
	{
		// Nettoie les retours la ligne
		$(memo).html($(memo).html().replace(/\n/g, ""));

		// Ajout des retours à la ligne qui vont biens
		$("div:first", memo).before("\n"); // Premier div
		$(memo).html(// Les autres div fermant et les double div qui démarre une imbrication
			$(memo).html()
				.replace(/<br>/ig, "<br>\n")
				.replace(/<\/div>/ig, "<\/div>\n")
				.replace(/<div><div>/ig, "<div>\n<div>")
		);

		// @todo ne fait qu'un niveau d'imbrication
		// Tabulation sur les imbrications
		$("div", memo).each(function(event) {
			if($(this).children().length > 1) $(this).children().before("\t")//\t
		});

		// Passe en mode source
		$("#view-source").addClass("checked");
		$(memo).addClass("view-source").text($(memo).html())//.html();
	}
}



/************** DIALOG **************/

// Dialog box avec effet de transfert
dialog = function(mode, source, target, callback) {

	// @todo: faire en sorte que la dialog fadeIn et fadeOut lorsqu'elle apparaît/disparaît. Pas juste visibility:hidden/visible...

	$.ajax({
			type: "POST",
			url: path+"api/ajax.admin.php?mode=dialog-"+mode, 
			data: {
				"target": target,
				"source": (target == "bg" ? $(source).attr("data-id") : source.id),
				"width": $(source).data("width") || "",
				"height": $(source).data("height") || "",
				"dir": $(source).data("dir") || "",
				"nonce": $("#nonce").val()
			}
		})
		.done(function(html){

			// Pour ne pas instancier plusieurs fois la dialog
			$(".dialog-"+mode).remove();
			
			// Création de la dialog invisible
			$("body").append(html);

			// Si l'ajax renvoie bien la dialog demandée
			if($(".dialog-"+mode).length) 
			{			
				// Instanciation de la dialog en mode invisible
				$(".dialog-"+mode).dialog({
					modal: true,
					autoOpen: false,
					width: "80%",
					close: function()
					{
						$(".dialog-"+mode).remove();

						$("body").off(".dialog-escape");// Unbind la fermeture avec touche echape
						
						// S'il y a une fonction de callback on l'exécute
						if(typeof callback === "function") callback();
					},
					create: function() 
					{
						if(mode == "media") 
						{
							// Création des onglets
							$(".dialog-media").tabs({
								beforeLoad: function(event, ui) {
									ui.ajaxSettings.url += ( /\?/.test(ui.ajaxSettings.url) ? "&" : "?" ) + 'nonce=' + $("#nonce").val();
								}
							});

							// Place les onglets à la place du titre de la dialog
							$(".dialog-media").siblings(".ui-dialog-titlebar").children(".ui-dialog-title").html($(".ui-tabs-nav")).parent().addClass("ui-tabs");

							// Place le moteur de recherche de media dans le titre de la dialog
							$("#recherche-media").detach().insertBefore(".dialog-media")//.prependTo(".ui-dialog");
						}
					},
					resize: function(event, ui) 
					{
						// Masque le texte dans les tab si on réduit trop la fenêtre
						if(ui.size.width < 635) $(".ui-tabs-nav span").hide();
						else $(".ui-tabs-nav span").show();
					}						
				});

				$(".dialog-"+mode).dialog("open");

				// Si touche échape on ferme la dialog
				$("body").on("keydown.dialog-escape", function(event) {
					if(event.keyCode === $.ui.keyCode.ESCAPE) $(".dialog-"+mode).dialog('close');
					event.stopPropagation();
				});;	
			}
		});
}



/************** MEDIA **************/

// Ouvre la fenêtre pour ajouter une image/fichier dans la galerie des medias (intext, isolate, bg)
media = function(source, target) {
	//$(memo_focus).focus();// On focus le contenu édité pour faire fonctionner onblur = close toolbox
	
	// Dialog de gestion des medias
	dialog("media", source, target, function() {					
			// Unbind le drag&drop pour l'ajout de média
			$("body").off(".dialog-media");

			// Relance les autres events
			editable_event();
			editable_media_event();
			body_editable_media_event();
		}
	);
}


// Upload d'un média
upload = function(source, file, resize)
{
	uploading = true;

	// Type de fichier supporté pour l'upload
	var mime_supported = [
		"image/jpg","image/jpeg","image/pjpeg","image/png","image/x-png","image/gif","image/x-icon",
		"application/pdf","application/zip","application/x-zip-compressed","text/plain"		
	];

	var width = $(source).data("width") || "";
	var height = $(source).data("height") || "";
	var data_class = $(source).data("class") || "";
	var dir = $(source).data("dir") || "";

	var domain_path = window.location.origin + path;

	if(file) 
	{
		//if(mime_supported.indexOf(file.type) > 0)// C'est bien un fichier supporté
		{				
			// @todo: ajouter un cog loading en sur l'image (a coter du % ?)

			// Layer pour la progressbar
			var progressid = "progress-" + source.attr("id");
			source.append("<div id='"+progressid+"' class='progress bg-color small' style='height: "+source.outerHeight()+"px;'></div>");			
			
			// Type mime du fichier
			var mime = (file.type ? file.type.split("/") : "");

			// Supprime les fichiers autres que image
			$("> .fa", source).remove();

			// Affiche la preview si image
			if(mime[0] == "image") 
			{
				// Si pas de tag img on le crée
				if($("img", source).html() == undefined) {
					if(width || height) 
						var style = " style='"+(width?" max-width:"+width+"px;":"")+(height?"max-height:"+height+"px;":"")+"'";
					else 
						var style = null;	

					$(source).append("<img"+(style)+(data_class?" class='"+data_class+"'":"")+">");
				}

				// On fade à moitié (50%)
				$("img", source).addClass("to50");

				var reader = new FileReader();
				reader.onload = function(theFile) {
					// On crée un objet image pour s'assurer que l'image est bien chargée dans le browser avant de prendre sa taille pour le layer de progression d'upload
					var image = new Image();
					image.src = theFile.target.result;

					image.onload = function() {// Image bien chargée dans le navigateur
						if($("#"+progressid).length) {			
							// Si l'upload n'est pas déjà fini on calle la source et la hauteur de la progress bar
							if(!$("img", source).attr("src")) {								
								$("img", source).attr("src", this.src);// On colle le bin de l'image dans le src
								$("#"+progressid).css("height", source.outerHeight()+"px");// On force la taille de progression d'upload
							}
						}
					};	
				}
				reader.readAsDataURL(file);
			}

			// Upload du fichier avec progressbar
			var data = new FormData();
			data.append("file", file);
			data.append("index", file.name);
			data.append("width", width);
			data.append("height", height);
			data.append("dir", dir);
			if(resize) data.append("resize", resize);
			data.append("nonce", $("#nonce").val());

			$.ajax({
				type: "POST",
				url: path+"api/ajax.admin.php?mode=add-media",
				xhr: function() {
					var xhr = $.ajaxSettings.xhr();
					if(xhr.upload) {									
						xhr.upload.addEventListener("progress", function (event) {// Progressbar
							if(event.lengthComputable){
								p100 = (event.loaded * 100 / event.total);
								$("#"+progressid).css("width", p100+"%").css("height", source.outerHeight()+"px").html(Math.floor(p100) + "%");//.toFixed(2)
							}
						}, false);
					}
					return xhr;
				},
				data: data,
				cache: false,
				contentType: false,
				processData: false,
				success: function(media)
				{					
					if(media.match('dialog-connect') || media.match('error'))// Si erreur ou problème de login
					{
						source.hide("slide", 300);
						$("body").append(media);
					}
					else if(media)// ça renvoi un fichier
					{
						source.removeClass("uploading");// Supprime le spin d'upload

						$("#"+progressid).css("width", "100%").css("height", source.outerHeight()+"px").html("100%");// Pour être sur d'afficher 100%
						
						// Si c'est une image
						if(mime[0] == "image") 
						{
							$("img", source).removeClass("to50");// On remet l'image à l'opacité normale
							$("img", source).attr("src", domain_path + media);// Affiche l'image finale 
						}
						else if(!source.attr("data-media"))// Si c'est un fichier autre et isolé
						{						
							$("img", source).remove();// Supprime les images
							$("[class*='fa-file']", source).remove();// Supprime les fichier déjà présent

							// On crée un bloc fichier
							$(source).append('<i class="fa fa-fw fa-doc mega" title="'+ media +'"></i>');	
						}
						
						// Nom du fichier final si dialog médias
						if(source.attr("data-media")) {
							source.attr("data-media", media);// Pour la manipulation (path + media)
							$(".file div", source).html(media.split('/').pop());// Pour l'affichage 
						}				

						// Détruis le layer de progressbar
						$("#"+progressid).fadeOut("medium", function() { 
							this.remove();
							source.addClass("uploaded");// Icone uploaded avec fadeinout
						});

						$(".supp", source).css("visibility","visible");// Affiche l'option de suppression

						if(!$(".dialog-media").length) tosave();// Mode : A sauvegarder
					}
					else {
						source.hide("slide", 300);
						error(__("Error"));
					}
					
					// Lance l'upload suivant
					if(typeof source_queue !== 'undefined' && source_queue.length > 0 && file_queue.length > 0)
						upload(source_queue.shift(), file_queue.shift());
					else
						uploading = false;// Fin des uploads
				}
			});

		}
		/*else {
			source.hide("slide", 300);
			error(__("This file format is not supported") + " : "+ file.type);
		}*/

		//console.log(data.files[0].type);
	}   	
}


// Insertion d'un fichier depuis la dialog media
get_file = function(id)
{	
	$(".dialog-media li").css("opacity","0.4");
	$("#"+id).css("opacity","1");

	if($("#dialog-media-target").val() == "isolate")// Insert dans un bloc isolé
	{	
		// Supprime les images
		$("#"+$("#dialog-media-source").val()+" img").remove();

		// Supprime les fichiers
		$("#"+$("#dialog-media-source").val()+" > .fa").remove();

		// Ajoute le fichier
		$("#"+$("#dialog-media-source").val()).append('<i class="fa fa-fw fa-doc mega" title="'+ $("#"+id).attr("data-media") +'"></i>');	
	}
	else// Insertion du lien vers le fichier dans bloc texte
		exec_tool("insertHTML", "<a href=\""+ $("#"+id).attr("data-media") +"\">"+ $("#"+id).attr("data-media").split('/').pop() +"</a>");

	// Fermeture de la dialog
	$(".dialog-media").dialog("close");
	
	tosave();// A sauvegarder
}


// Insertion d'une image depuis la dialog media
get_img = function(id, link)
{	
	//@todo ajouter un loading pour informer que l'on resize l'image avant fermeture de la dialog
	//@todo voir pour faire un fade opacity en js, car en css ça fait un bug lors de l'ouverture de la dialog
	
	// Focus sur l'image choisie
	$(".dialog-media li").css("opacity","0.4");
	$("#"+id).css("opacity","1");
	
	var width = $("#dialog-media-width").val();
	var height = $("#dialog-media-height").val();

	var media_source = $("#dialog-media-source").val();

	var crop = $("#"+media_source).hasClass('crop');
	
	var data_class = $("#"+media_source).data("class") || "";

	// Si id ou data-id pour les bg()
	var dir = $("#"+media_source).data("dir") || ($("[data-id='"+media_source+"']").data("dir") || "");

	var domain_path = window.location.origin + path;

	// Image en lazyloading dans un contenu éditable
	var lazy = ($("#"+media_source).hasClass("lazy")?' loading="lazy"':'');


	// Resize de l'image et insertion dans la source
	$.ajax({
		type: "POST",
		url: path+"api/ajax.admin.php?mode=get-img",
		data: {
			"img": $("#"+id).attr("data-media"),
			"width": width,
			"height": height,
			"dir": dir,
			"crop": crop,
			"nonce": $("#nonce").val()
		},
		success: function(final_file)
		{ 
			if($("#dialog-media-target").val() == "isolate")// Insert dans un bloc isolé
			{
				// Si pas encore de tag img
				if($("#"+media_source+" img").html() == undefined)
				{
					// Supprime les fichiers
					$("#"+media_source+" > .fa").remove();

					// Ajoute l'image
					$("#"+media_source).append('<img src="'+ domain_path + final_file +'"'+
						(width || height?' style="'+
								(width?'max-width: '+width+'px;':'') + (height?'max-height: '+height+'px;':'')
							+'"':'')+
						(data_class?" class=\'"+data_class+"\'":"")+'>');
				}
				else
					$("#"+media_source+" img").attr("src", domain_path + final_file);
			}
			else if($("#dialog-media-target").val() == "intext")// Ajout dans un contenu texte
			{
				if(typeof link !== 'undefined' && link)// Avec lien zoom
					exec_tool("insertHTML", '<a href="'+ $("#"+id).attr("data-media") +'"><img src="'+ domain_path + final_file +'" class="fl"'+lazy+'></a>');
				else// Juste l'image
					exec_tool("insertHTML", '<img src="'+ domain_path + final_file +'" class="fl"'+lazy+'>');				
			}
			else if($("#dialog-media-target").val() == "bg")// Modification d'un fond
			{
				var dataidsource = "[data-id='"+media_source+"']";
				$(dataidsource).attr("data-bg", domain_path + final_file);
				$(dataidsource).css("background-image", "url("+ domain_path + final_file +")");

				// Ajout du bt supp si pas existant
				if(!$(dataidsource+" .clear-bg").length)
				$(dataidsource+" .bg-tool").prepend(clearbg_bt);
			}

			// Fermeture de la dialog
			$(".dialog-media").dialog("close");
			
			tosave();// A sauvegarder
		}
	});
}

// Alignement de l'image intext
img_position = function(align) {
	var figure = $(memo_img).closest("figure");

	// Si l'image est dans une figure
	if(figure.length) 
		if(figure.hasClass(align)) figure.removeClass(align);
		else figure.removeClass("center fl fr").addClass(align);
	else 
		if($(memo_img).hasClass(align)) $(memo_img).removeClass(align);
		else $(memo_img).removeClass("center fl fr").addClass(align);
}

// Pour ajouter une légende sous l'image
img_figure = function() {
	// Si on est déjà dans un élément entouré du 'figure & figcaption' => on les supp
	if($(memo_img).closest("figure").length)
	{
		$("#figure").removeClass("checked");

		// Récupère les class de figure pour la remettre sur l'image
		var figure_class = $(memo_img).closest("figure").attr("class");
		$(memo_img).addClass(figure_class);

		// Supprime figure & figcaption
		$(memo_img).parent(".editable .ui-wrapper").unwrap().next("figcaption").remove();
	}
	else 
	{
		$("#figure").addClass("checked");

		// Récupère les class de l'image pour les mettre sur figure
		var img_class = $(memo_img).removeClass("ui-resizable").attr("class");
		$(memo_img).removeClass("center fl fr")

		// Ajoute la figure et le figcaption
		$(memo_img).parent(".editable .ui-wrapper")
	   		.after("<br>")// Pour pouvoir ajouter des contenus à la suite de la figure
	    	.wrap("<figure class='"+img_class+"' />")
	    	.after("<figcaption>"+ __("Subtitle") +"</figcaption>");
	}
}

// Supprime l'image sélectionnée du contenu
img_remove = function() {
	$(memo_img).remove();
	$("#img-tool").remove();
	memo_img = null;
}

// Transfert width/height du style vers la dom img
img_transfert_style = function(event) {
	var width = $(event).css('width');
	var height = $(event).css('height');
	if(width && height) {
		$(event).attr('width', parseInt(width));
		$(event).attr('height', parseInt(height));
		$(event).removeAttr('style');
	}
	$(event).removeClass("ui-resizable");
}

// Si on focus-out/drag-leave d'une image dans bloc éditable
img_leave = function() 
{
	// Supprime la barre d'outil image
	$("#img-tool").remove();

	// Supprime le resizer s'il y en a un
	if($('.editable .ui-wrapper img').length) $('.editable .ui-wrapper img').resizable('destroy');
	else if($('.editable .ui-wrapper').length) $('.editable .ui-wrapper').remove();
		
	// Supprime le style sur l'image sélectionnée et le transfert sur la dom de l'image
	if(memo_img) {
		img_transfert_style(memo_img);
		memo_img = null;
	}
	else {		
		$(".editable img").each(function() {
			img_transfert_style(this);
		});
	}
}

// Retourne le poids d'un fichier
filesize = function(file) {

    var request = new XMLHttpRequest();

    request.open("HEAD", file, false);

    request.send(null);

	//request.getResponseHeader('content-length')
    /Content\-Length\s*:\s*(\d+)/i.exec(request.getAllResponseHeaders());
    return Math.ceil(parseInt(RegExp.$1) / 1024);// Taille en Ko
}

// Optimise l'image à la demande
img_optim = function(option, that) {

	// Loading
	$(that).html("<i class='fa fa-cog fa-spin'></i>");

	// Disable les bt d'optim
	$(".dialog-optim-img .bt").attr("onclick","");

	// L'image
	img = $("img", $(that).parent());

	// Scroll jusqu'a l'image
	scrollToImg(img);

	// Donnée sur l'image
	src = $(img).attr("src");

	var width = imgs[src]['width'];
	var height = imgs[src]['height'];

	original_filesize = imgs[src]['size'];// Poids de l'image d'origine

	var domain_path = window.location.origin + path;// Domaine complet

	src = src.replace(domain_path, "");// Supprime le domaine du nom de l'image
	
	var img_nomedia = src.replace(/media\//, "").replace(/resize\//, "");// Chemin sans media

	// Si le chemin contien un dossier
	if(img_nomedia.indexOf("/") !== -1) 
	{
		var img_name = src.split("?")[0].split('/').pop();// nom-image.ext sans ce qu'il y a après "?" et après le dossier "/"
		var dir = img_nomedia.split("/"+img_name).shift();// Prends la première partie avant le nom de l'image
	}
	else var dir = "";

	// Resize de l'image et remplacement
	$.ajax({
		type: "POST",
		url: path+"api/ajax.admin.php?mode=get-img",
		data: {
			"img": src,
			"width": width,
			"height": height,
			"dir": dir,
			"option": option,
			"nonce": $("#nonce").val()
		},
		success: function(final_file)
		{ 
			// Détection du poids de la nouvelle image
			new_filesize = filesize(domain_path + final_file);

			// Infobulle sur le gain de poids
			if($.isNumeric(original_filesize))
				light(Math.round((original_filesize - new_filesize)*100/original_filesize) +"% d'économie<div class='grey small'>"+original_filesize+"Ko => "+new_filesize+"Ko</div>", 2500);
			else
				light("Nouvelle taille de l'image : "+new_filesize+"Ko", 2500);

			// Affectation de la nouvelle image
			if(imgs[src]['type'] == 'bg')
				$('[data-bg$="'+src+'"]').attr({
					"data-bg": domain_path + final_file,
					"style": "background-image: url('"+domain_path + final_file+"')"
				});
			else
				$('img[src$="'+src+'"]').attr("src", domain_path + final_file);		
		
			tosave();// A sauvegarder

			// On recharge les optimisations d'image
			setTimeout(function() {// Timeout pour eviter la cache navigateur sur les widthXheight
				img_check();
			}, 1000);			
		}
	});
}


// Scroll jusqu'a une image
scrollToImg = function(that){
	
	//@todo test le cas ou 2 fois la meme image dans le contenu

	// si c'est une image en fond
	if($(that).hasClass('bg'))
		var scrollTo = $('[data-bg$="'+$(that).attr("src")+'"]').offset().top - $("#admin-bar").height();
	else
		var scrollTo = $('img[src$="'+$(that).attr("src")+'"]').offset().top - $("#admin-bar").height();	

	var scrollTo = (scrollTo > $("#admin-bar").height() ? scrollTo : 0);

	$("html, body").animate({ scrollTop: scrollTo	}, 300, "linear");
}

// Liste les images dans la page pour suggérer des optimisations
img_check = function(file) 
{
	imgs = {};
	var imgs_size = 0;
	host = location.protocol +'//'+ location.host + path;

	// Contenu des images éditables, bg et dans les contenus textuels
	$(document).find("main img.editable, main .editable img, main [data-bg]").each(function()
	{
		if($(this).hasClass("editable-bg")) {// Image en background
			var src = $(this).attr("data-bg").replace(host, "");
			if(src) {
				imgs[src] = {};
				imgs[src]['type'] = 'bg';
			}

			// Taille de l'image
			/*var bg = new Image();
		    bg.src = item.css('background-image').replace(/url\(|\)$|"/ig, '');
			imgs[src]['width'] = bg.width;
			imgs[src]['height'] = bg.height;*/
		}
		else {// Image dans contenu éditable ou fonction media
			var src = $(this).attr("src").replace(host, "");
			if(src) {
				imgs[src] = {};
				imgs[src]['type'] = 'img';

				// Taille dans la dom
				imgs[src]['width'] = $(this)[0].width;//clientWidth
				imgs[src]['height'] = $(this)[0].height;

				// Taille réel de l'image
				imgs[src]['naturalWidth'] = $(this)[0].naturalWidth;
				imgs[src]['naturalHeight'] = $(this)[0].naturalHeight;
			}
		}
	});

	console.log(imgs);

	// S'il y a des images
	if(Object.keys(imgs).length > 0)
	{
		// Dialog des images // nw
		$("body").append("<div class='dialog-optim-img' title='"+__("Image optimization")+"'><ul class='pan unstyled smaller'></ul></div>");

		// Dialog en layer
		$(".dialog-optim-img").dialog({
			autoOpen: false,
			width: 'auto',
			maxHeight: 500,
			position: { my: "right-10 top", at: "left bottom+10", of: $("#admin-bar") },
			show: function() {$(this).fadeIn(300);},
			close: function() { $(".dialog-optim-img").remove(); }
		});
		$(".dialog-optim-img").parent().css({position:"fixed"}).end().dialog('open');

		// Liste les images
		var num = 0;
		$.each(imgs, function(src, img)
		{
			// Si l'image existe sa taille original est !=0
			if(img.naturalWidth != 0)
			{
				var optimize = '';

				// extraction de l'Extention
				var ext = /(?:\.([^.]+))?$/.exec(src.split("?")[0])[1];

				// extraction de la Taille
				var size = filesize(src);
				imgs[src]['size'] = size;

				// total des poids d'image
				imgs_size = imgs_size + size;

				// Image dans le contenu
				if(img.type == 'img')
				{
					// Vérifie la taille de l'image pour proposer une optimisation
					var widthRatio = (img.width / img.naturalWidth) * 100;
					var heightRatio = (img.height / img.naturalHeight) * 100;

					// Image + grande que la zone afficher => Redimentionnement
					if(widthRatio < 80 || heightRatio < 80)
						optimize = "<a href='javascript:void(0)' onclick=\"img_optim('resize', this)\" class='bt small vam' style='padding: 0 .5rem'>"+__("Resize")+"</a> ";
				}

				// Si c'est un png & lourd => Conversion en jpg (alpha => blanc)
				if(ext == 'png' && size > img_green)
					optimize+= "<a href='javascript:void(0)' onclick=\"img_optim('tojpg', this)\" class='bt small vam' style='padding: 0 .5rem'>"+__("Convert to")+" jpg</a> ";

				// Si jpg & lourd => compression //@todo preview avec choix du taux de compression
				/*if(ext == 'jpg' && size > img_warning)
					optimize+= "<a href='javascript:void(0)' onclick=\"img_optim('compress', this)\" class='bt small vam' style='padding: 0 .5rem'>"+__("Compress")+"</a> ";*/

				// Couleur de vigilance
				if(size <= img_green) var imgcolor = 'green';
				else if(size > img_green && size < img_warning) var imgcolor = 'orange';
				else if(size >= img_warning) var imgcolor = 'red';

				// Affichage
				$(".dialog-optim-img ul").append("<li class='"+imgcolor+" pbt'><img src='"+src+"' width='50' class='pointer "+img.type+"' onclick='scrollToImg(this)' title='"+src.split("?")[0] +" | "+ (imgs[src]['naturalWidth']?imgs[src]['naturalWidth']+"x"+imgs[src]['naturalHeight']+"px":__("Background"))+"'> ["+ext+"] <span class='size'>"+size+"Ko</span> "+optimize+"</li>");

				++num;
			}

		});


		// Statistique final

		// Poids
		if(imgs_size <= imgs_green) var sizecolor = 'green';
		else if(imgs_size > imgs_green && imgs_size < imgs_warning) var sizecolor = 'orange';
		else if(imgs_size >= imgs_warning) var sizecolor = 'red';

		// Nombre d'image
		if(num < imgs_num) var numcolor = 'green';
		else if(num == imgs_num) var numcolor = 'orange';
		else if(num > imgs_num) var numcolor = 'red';

		$(".dialog-optim-img ul").after("<div class='ptt smaller bold'><span class='"+numcolor+"' title='"+__("Limit")+" "+imgs_num+"'>"+num+" images</span> = <span class='"+sizecolor+"' title='"+__("Limit")+" "+imgs_warning+"Ko'>"+imgs_size+"Ko</span></div>");

	}
}



/************** FERMETURE ADMIN **************/

// Recharge la page en cours
reload = function() {
	document.location.href = clean_url();
}


// Vérifie que le contenu est sauvegardé en cas d'action de fermeture ou autres
/*$(window).on("beforeunload", function(){
	if($("#admin-bar button.to-save").length || $("#save i.fa-spin").length) return __("The changes are not saved");
});*/



/************** ONLOAD **************/
$(function()
{							
	lucide = true;

	// Ajout de la class pour dire que l'on est en mode admin
	$("body").addClass("lucide");


	/************** ADMINBAR **************/

	// Ajout des variables dans les inputs (pour le problème de double cote ")
	$("#admin-bar #title").val(document.title);

	if($("meta[name=description]").last().attr("content") != undefined) 
		description = $('meta[name=description]').last().attr("content");
	else
		description = "";

	$("#admin-bar #description").val(description);


	if(/noindex/i.test($('meta[name=robots]').last().attr("data"))) $("#admin-bar #noindex").prop("checked", true);
	if(/nofollow/i.test($('meta[name=robots]').last().attr("data"))) $("#admin-bar #nofollow").prop("checked", true);


	$("#admin-bar #permalink").val(permalink);
	//$("#admin-bar #type").val(type);
	//$("#admin-bar #tpl").val(tpl);


	// Dossier spécifique média pour l'image pour og:image
	if($("#visuel").data('dir')) $("#admin-bar #og-image").data('dir', $("#visuel").data('dir'));

	// On récupère og:image des meta
	if($("meta[property='og:image']").last().attr("content") != undefined) 
	{
		// Bind l'image
		$("#admin-bar #og-image img").attr("src", $("meta[property='og:image']").last().attr("content"));

		// Option de suppression de l'image
		$("#admin-bar #og-image").after("<a href='javascript:void(0)' onclick=\"$('#admin-bar #og-image img').attr('src','');$(this).remove();\"><i class='fa fa-cancel absolute' title='"+ __("Remove") +"'></i></a>");
	}


	// Ouverture de l'édition du title si en mode responsive
	$("#meta-responsive i").on("click",	function() {
		$("#meta").addClass("tooltip slide-left fire pat").css({"position": "absolute", "top": $("#admin-bar").height()}).fadeToggle();			
	});


	/************** CONTENTEDITABLE **************/

	// spellcheck="false" wrap="off" autofocus placeholder="Enter something ..."
	
	// Pour corriger le drag&drop de texte dans firefox span > div
	$(".editable:not(img)").replaceWith(function () { 

		// Pour corriger les div qui ne prennent pas toutes la largeur a cause des img en float
		var style = null;
		if($(this).parent().is("article")) style = "width: "+$(this).parent().width()+"px;";//if($(this).parent().children().length <= 1)

		// Clean la dom
		return $("<"+ $(this)[0].tagName.toLowerCase() +"/>", { 
			class: $(this).attr("class"),
			id: this.id,
			html: this.innerHTML,
			style: style,
			"data-dir": $(this).data("dir"),
			placeholder: $(this).attr("placeholder")
		});
	});

	// Rends les textes éditables
	$(".editable:not(img)").attr("contenteditable","true");


	// Si readonly
	$(".editable.readonly").attr("contenteditable", false);

	// Si champ numerique on ne garde que les chiffre et les points
	$(".editable.number").on("keypress", function(event){//input keyup keydown change
		key = event.keyCode || event.charCode;

		// <- -> backspace supp && ., && [0-9]
		if(
			(!/^(37|39|8|46)$/.test(event.keyCode) && !/^(46|44)$/.test(event.charCode) && !(key >= 48 && key <= 57))// Si pas point/virgule et pas chiffre
			||
			(/^(46|44)$/.test(event.charCode) && /[.,]/.test(this.innerHTML))// Si point/virgule si déjà présent
		) 
		event.preventDefault();
	});


	// Place les contenus au-dessus pour les rendre éditables à coup sur
	$(".editable").parent().css("z-index", "10");

	// Pour pouvoir éditer un contenu dans un label
	$(".editable").parent("label").attr("for","");



	/************** TOOLBOX **************/

	// Barre d'outils de mise en forme : toolbox
	toolbox = "<ul id='txt-tool' class='toolbox'>";

		if(typeof toolbox_h2 != 'undefined') 
			toolbox+= "<li><button onclick=\"html_tool('h2')\" id='h2' title=\""+__("Title")+" H2"+"\"><i class='fa fa-fw fa-header'></i><span class='minus'>2</span></button></li>";

		if(typeof toolbox_h3 != 'undefined') 
			toolbox+= "<li><button onclick=\"html_tool('h3')\" id='h3' title=\""+__("Title")+" H3"+"\"><i class='fa fa-fw fa-header'></i><span class='minus'>3</span></button></li>";

		if(typeof toolbox_h4 != 'undefined') 
			toolbox+= "<li><button onclick=\"html_tool('h4')\" id='h4' title=\""+__("Title")+" H4"+"\"><i class='fa fa-fw fa-header'></i><span class='minus'>4</span></button></li>";

		if(typeof toolbox_bold != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('bold')\"><i class='fa fa-fw fa-bold'></i></button></li>";

		if(typeof toolbox_italic != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('italic')\"><i class='fa fa-fw fa-italic'></i></button></li>";

		if(typeof toolbox_underline != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('underline')\"><i class='fa fa-fw fa-underline'></i></button></li>";
		
		if(typeof toolbox_superscript != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('superscript')\"><i class='fa fa-fw fa-superscript'></i></button></li>";
				
		if(typeof toolbox_fontSize != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('fontSize', '2')\" title=\""+__("R\u00e9duire la taille du texte")+"\"><i class='fa fa-fw fa-resize-small'></i></button></li>";
		
		if(typeof toolbox_blockquote != 'undefined') 
			toolbox+= "<li><button onclick=\"html_tool('blockquote')\" id='blockquote'><i class='fa fa-fw fa-quote-left'></i></button></li>";

		if(typeof toolbox_insertUnorderedList != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('insertUnorderedList')\"><i class='fa fa-fw fa-list'></i></button></li>";

		if(typeof toolbox_justifyLeft != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('justifyLeft')\" id='align-left'><i class='fa fa-fw fa-align-left'></i></button></li>";

		if(typeof toolbox_justifyCenter != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('justifyCenter')\" id='align-center'><i class='fa fa-fw fa-align-center'></i></button></li>";

		if(typeof toolbox_justifyRight != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('justifyRight')\" id='align-right'><i class='fa fa-fw fa-align-right'></i></button></li>";

		/*if(typeof toolbox_justifyFull != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('justifyFull')\" id='align-justify'><i class='fa fa-fw fa-align-justify'></i></button></li>";*/

		if(typeof toolbox_InsertHorizontalRule != 'undefined') 
			toolbox+= "<li><button onclick=\"exec_tool('InsertHorizontalRule')\" title=\""+__("Ajoute une barre de s\u00e9paration")+"\"><i class='fa fa-fw fa-resize-horizontal'></i></button></li>";

		if(typeof toolbox_viewsource != 'undefined') 
			toolbox+= "<li><button onclick=\"view_source(memo_focus)\" id='view-source' title=\""+__("See the source code")+"\"><i class='fa fa-fw fa-code'></i></button></li>";

		if(typeof toolbox_icon != 'undefined') 
			toolbox+= "<li><button onclick=\"dialog('icon', memo_focus)\" title=\""+__("Icon Library")+"\"><i class='fa fa-fw fa-flag'></i></button></li>";

		if(typeof toolbox_media != 'undefined') 
			toolbox+= "<li><button onclick=\"media(memo_focus, 'intext')\" title=\""+__("Media Library")+"\"><i class='fa fa-fw fa-picture'></i></button></li>";

		//toolbox+= "<li><button onclick=\"exec_tool('unlink')\"><i class='fa fa-fw fa-chain-broken'></i></button></li>";

		if(typeof toolbox_anchor != 'undefined') 
		{
			toolbox+= "<li><button onclick=\"anchor_option(); $('#txt-tool #anchor-option #anchor').select();\" title=\""+__("Add Anchor")+"\"><i class='fa fa-fw fa-hashtag grey'></i></button></li>";

			toolbox+= "<li id='anchor-option' class='option'>";
				toolbox+= "<input type='text' id='anchor' placeholder=\""+ __("Anchor") +"\" title=\""+ __("Anchor") +"\" class='w150p small'>";
				toolbox+= "<button onclick=\"anchor()\" class='small plt prt'><span>"+ __("Add Anchor") +"</span><i class='fa fa-fw fa-plus'></i></button>";
			toolbox+= "</li>";
		}

		if(typeof toolbox_link != 'undefined') 
		{
			toolbox+= "<li><button onclick=\"link_option(); $('#txt-tool #link-option #link').select();\" title=\""+__("Add Link")+"\"><i class='fa fa-fw fa-link'></i></button></li>";

			toolbox+= "<li id='link-option' class='option'>";

				toolbox+= "<input type='text' id='link' placeholder='http://' title=\""+ __("Link") +"\" class='w150p small'>";

				if(typeof toolbox_bt != 'undefined') toolbox+= "<a href=\"javascript:class_bt();void(0);\" title=\""+ __("Apparence d'un bouton") +"\" id='class-bt' class='o50 ho1'><i class='fa fa-login mlt mrt vam'></i></a>";
				
				toolbox+= "<a href=\"javascript:target_blank();void(0);\" title=\""+ __("Open link in new window") +"\" id='target-blank' class='o50 ho1'><i class='fa fa-link-ext mlt mrt vam'></i></a>";

				toolbox+= "<button onclick=\"link()\" class='small plt prt'><span>"+ __("Add Link") +"</span><i class='fa fa-fw fa-plus'></i></button>";

			toolbox+= "</li>";
		}

	toolbox+= "</ul>";
	
	// Init la toolbox
	$("body").append(toolbox);
	
	// Fonction de positionnement de la toolbox
	toolbox_position = function(top, left, position) {		
		// Valeur par défaut de "position"
		if(typeof position === 'undefined') var position = "absolute";

		// Posionnement
		$("#txt-tool").css({
			top: top + "px",
			left: left + "px",
			position: position
		});
	}	

	// Action sur les champs éditables
	editable_event = function()
	{	
		// Désactive les liens qui entourent un élément éditable
		$(".editable").closest("a").on("click", function(event) { event.preventDefault(); });
		
		// Action sur les zone éditable
		$(".editable").on({
			"focus.editable": function() {// On positionne la toolbox
				memo_focus = this;// Pour memo le focus en cours
			},
			"blur.editable": function() {
				if($("#txt-tool:not(:hover)").val()=="") {
					$("#txt-tool").hide();// ferme la toolbox
					$(window).off(".scroll-toolbox");// Désactive le scroll de la toolbox
				}
			},
			"dragstart.editable": function() {// Pour éviter les interférences avec les drag&drop d'image dans les champs images
				$("body").off("img.editable");// Désactive les events image
				$("#img-tool").remove();// Supprime la barre d'outil image
			},
			"dragend.editable": function() {// drop dragend
				// Active les events block image
				editable_media_event();
				body_editable_media_event();

				memo_img = null;
				img_leave();// Raz Propriétés image
			},			
			"keyup.editable": function() {// Mémorise la position du curseur
				memo_selection = window.getSelection();				
				if(memo_selection.anchorNode) {
					memo_range = memo_selection.getRangeAt(0);
					memo_node = selected_element(memo_range);//memo_selection.anchorNode.parentElement memo_range.commonAncestorContainer.parentNode
				}
			},
			"click.editable": function(event){// Désactive les ouvertures de liens sous ie
				event.preventDefault();
			},
			"mouseup.editable": function(event)// Si on click dans un contenu éditable
			{		
				$("#txt-tool .option").hide();// Cache le menu d'option		

				// @todo voir si le fait de ne pas raz les memo_ ne crée pas de problème colatéraux...
				
				// Mémorise la sélection pour la retrouver au focus après ajout de lien
				memo_selection = window.getSelection();				
				if(memo_selection.anchorNode) {
					memo_range = memo_selection.getRangeAt(0);
					memo_node = selected_element(memo_range);//memo_selection.anchorNode.parentElement memo_range.commonAncestorContainer.parentNode
				}
				else {
					if(typeof memo_range === 'undefined') memo_range = null;
					if(typeof memo_node === 'undefined') memo_node = null;
				}


				// Si la toolbox est autorisé
				if(!$(this).hasClass("notoolbox"))
				{
					adminbar_height = $("#admin-bar").outerHeight();
					//this_offset_top = $(memo_focus).offset().top;
					//this_left = $(this).offset().left;

					toolbox_height = $("#txt-tool").outerHeight();

					// Si déjà un contenu
					if(memo_range && memo_range.getClientRects()[0] != undefined)
						this_top = memo_range.getClientRects()[0].top + $(window).scrollTop();// position du caractère + scroll
					else 
						this_top = $(memo_focus).offset().top;// position de la div/tag

					this_top_scroll = this_top - toolbox_height - 12;

					this_left = (memo_range && memo_range.getClientRects()[0] != undefined ? memo_range.getClientRects()[0].left : $(this).offset().left) - 12;

					// Si on est en mode view source on colore le bt view-source
					if($(memo_focus).hasClass("view-source"))
						$("#view-source").addClass("checked");
					else
						$("#view-source").removeClass("checked");

					// Affichage de la boîte à outils texte
					if($("#txt-tool").css("display") == "none")// Si pas visible // init			
					$("#txt-tool")
						.show(function(){
							// Positionnement en fonction de la hauteur de la toolbox une fois visible
							toolbox_height = $("#txt-tool").outerHeight();
							this_top_scroll = this_top - toolbox_height - 12;

							toolbox_position(this_top_scroll, this_left);
						});	

					// Positionnement de la toolbox si déjà affiché et gestion du Scroll si on descend
					$(window).on("scroll click.scroll-toolbox", function(event) {
						// Si (Hauteur du scroll + hauteur de la bar d'admin en haut + hauteur de la toolbox + pico) > au top de la box editable = on fixe la position de la toolbox en dessou de la barre admin
						if(($(window).scrollTop() + toolbox_height + 12) > this_top_scroll) 
							toolbox_position(adminbar_height, this_left, "fixed");
						else
							toolbox_position(this_top_scroll, this_left, "absolute");
					});
				}


				// Si on est sur un h2/3 on check l'outil dans la toolbox
				if($(memo_node).closest("h2").length) $("#txt-tool #h2").addClass("checked");
				else $("#txt-tool #h2").removeClass("checked");
					
				if($(memo_node).closest("h3").length) $("#txt-tool #h3").addClass("checked");
				else $("#txt-tool #h3").removeClass("checked");

				if($(memo_node).closest("h4").length) $("#txt-tool #h4").addClass("checked");
				else $("#txt-tool #h4").removeClass("checked");

				if($(memo_node).closest("blockquote").length) $("#txt-tool #blockquote").addClass("checked");
				else $("#txt-tool #blockquote").removeClass("checked");
					

				// Désélectionne les alignements
				$("[class*='fa-align']").parent().removeClass("checked");
				
				var align = null;

				// On cherche le type d'alignement si on est dans un bloc aligné avec les style
				if($(memo_node).closest("div [style*='text-align']")[0]) var align = $(memo_node).closest("div [style*='text-align']").css("text-align");
				
				// On cherche le type d'alignement si on est dans un bloc aligné avec align=
				if($(memo_node).closest("div [align]")[0]) var align = $(memo_node).closest("div [align]").attr("align");
								
				// On check le bon alignement
				if(align) $("#align-"+align).addClass("checked");


				// Si on sélectionne un contenu
				//if(memo_selection.toString().length > 0)
				{
					// Si on est sur un lien on ouvre le menu lien en mode modif
					if($(memo_node).closest("a[href]").length) link_option();

					// Si on est sur une ancre on ouvre le menu ancre en mode modif
					if($(memo_node).closest("a[name]").length) anchor_option();
				}
				//else memo_selection = memo_range = memo_node = null;// RAZ Sélection		
			}
			
		});
	}

	// Exécute l'event sur les champs éditables
	editable_event();


	// Fonction qui supprime les contenus HTML indésirables sauf ceux autorisés
	function strip_tags(input, allowed) {
		if (input == undefined) return "";

		// Tags en miniature
	    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');

	    // Garde uniquement les tags autorisés
	    return input.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, function ($0, $1) {
	    	return allowed.indexOf("<" + $1.toLowerCase() + ">") > -1 ? $0 : "";
	    });
	}

	// Supprime la mise en forme des contenus copier/coller [contenteditable]
	$(".editable").on("paste", function(event) {
		event.preventDefault();

		// Mode de prélèvement et d'injection
		if($(this).hasClass("view-source")) var getData = "text/plain", insertMode = "insertText";
		else var getData = "text/html", insertMode = "insertHTML";

		// Récupère les contenus du presse-papier // text/html text/plain
		var paste = 
			(event.originalEvent || event).clipboardData.getData(getData) ||
			(event.originalEvent || event).clipboardData.getData("text/plain") ||
			prompt(__("Paste something..."));

		// Supprimes les commentaires HTML
		//paste = paste.replace(/<!--[\s\S]*?-->/gi, "");
		// + Supprime aussi les supportLists de word (Correction de Dominique)
		paste = paste.replace(/<![\s\S]*?>/gi, "");

		// Si pas en mode visionnage du code source & 
		if(!$(this).hasClass("view-source")) 
		{
			// Html dans le paste
			if(/<[a-z][\s\S]*>/i.test(paste))
			paste = paste
				.replace(/\n|\r/gi, "")// Clean les retours à la ligne

			    .replace(/<p[^>]*><br><\/p><\/div>/gi, "\n")// <br> dans des </p></div>
			    .replace(/<p[^>]*><span><\/span><br><\/p>/gi, "\n")// <br> dans des <p> => \n

			    .replace(/<p[^>]*>/gi, "")// Supp les <p> 
			    .replace(/<\/p>/gi, "\n")// Ajoute un saut à la place des <p>

			    .replace(/<br>|<\/div>/gi, "\n")// Normalise les objets qui font des retours à la ligne

			// Transforme les retours à la ligne en <br>
			paste = paste.replace(/\n/gi, "<br>");

			// Clean les tags
			paste = strip_tags(paste, "<a></a><b><b/><i></i><br>");
		}

		// Insertion dans le contenu insertHTML insertText
		exec_tool(insertMode, paste);

		// Double switch pour formater en mode source
		if($(this).hasClass("view-source")) {
			view_source(memo_focus);// Mode normal
			view_source(memo_focus);// Mode source formaté
		}
	});


	// Action sur le input de lien si keyup Enter
	$("#txt-tool .option #link").keyup(function(event) { if(event.keyCode == 13) link() });



	/************** IMAGES DANS LES BLOCS TEXTE **************/
	memo_img = null;

	// @todo: voir si on ne peux pas le déplacer sur le blur des event .editable
	$("body").click(function(event) {
		// Si on n'est pas sur une image dans un contenu éditable ou edition du alt on supp la toolbox image
		if(!$(event.target).is('.editable img, #alt')) img_leave();// Raz Propriétés image
		
		// Supprime le layer de redimensionnement d'image
		if($("#resize-tool").html() != undefined && !$(event.target).closest("#resize-tool").is('#resize-tool')) {
			$("#resize-tool").remove();
			$(".dialog-media li.select").removeClass("select");// Deselectionne l'image
		} 
	});

	// Affiche les options de gestion d'alignement sur les images ajouter
	$(".editable").on("click", "img", function(event) {
		
		event.stopPropagation();

		// Supprimer le précédent bloc d'outils
		$("#img-tool").remove();

		// Masque la toolbox d'edition des textes
		$("#txt-tool").hide();// ferme la toolbox
		
		// Mémorise l'image sélectionnée
		memo_img = this;		
		
		// On ajoute le resizer jquery 
		//if($.browser.webkit)// Si Chrome // Visiblement Firefox n'a plus d'outil de resize...
		{
			// Rend l'image resizeable
			$(this).resizable({aspectRatio: true});
			
			// Pour styler le block image sélectionné (Même alignement et display entre le div et l'img)
			$(this).parent(".ui-wrapper").addClass($(this).attr('class'));
			$(this).parent(".ui-wrapper").css('display', $(this).css('display'));
		}
		
		// Boîte à outils image
		option = "<ul id='img-tool' class='toolbox'>";

			option+= "<li><button onclick=\"img_position('fl')\" class='img-position' id='img-fl'><i class='fa fa-fw fa-align-left'></i></button></li>";
			option+= "<li><button onclick=\"img_position('center')\" class='img-position' id='img-center'><i class='fa fa-fw fa-align-center'></i></button></li>";
			option+= "<li><button onclick=\"img_position('fr')\" class='img-position' id='img-fr'><i class='fa fa-fw fa-align-right'></i></button></li>";

			if(typeof toolbox_figure != 'undefined') option+= "<li><button onclick=\"img_figure()\" id='img-figure'>"+ __("Subtitle") +"</button></li>";

			option+= "<li class=''><input type='text' id='alt' placeholder=\""+ __("Image caption") +"\" title=\""+ __("Image caption") +"\" class='w150p small'></li>";

			option+= "<li><button onclick=\"img_remove()\" title=\""+ __("Delete") +"\"><i class='fa fa-fw fa-trash'></i></button></li>";

		option+= "</ul>";

		$("body").append(option);

		// Récupère le texte du l'alt de l'image sélectionné pour le mettre dans les options d'édition de l'alt
		$("#alt").val($(memo_img).attr('alt'));
		

		// Si l'image est encadrer par une <figure> pour un <figcaption>
		if($(memo_img).closest("figure").length) $("#img-figure").addClass("checked");	
		else $("#img-figure").removeClass("checked");


		// Alignement de l'image
		$("#img-position").removeClass("checked");
		if($(memo_img).hasClass("fl") || $(memo_img).closest("figure").hasClass("fl")) $("#img-fl").addClass("checked");
		if($(memo_img).hasClass("center") || $(memo_img).closest("figure").hasClass("center")) $("#img-center").addClass("checked");
		if($(memo_img).hasClass("fr") || $(memo_img).closest("figure").hasClass("fr")) $("#img-fr").addClass("checked");	

		$("#img-tool")
			.show()
			.offset({
				top: ( $(this).offset().top - $("#img-tool").height() - 8 ),
				left: ( $(this).offset().left )
			});
	});

	// Si on tape au clavier on ajoute le texte alt à l'image
	$("body").on("keyup", "#alt", function(event) {
		$(memo_img).attr('alt', $(this).val());
	});



	/************** IMAGE/FICHIER SEUL **************/

	// Charge les images en lazy load pour qu'elles puissent être sauvegardé
	$("[loading='lazy']").each(function() {
		$(this).attr("src", $(this).data("src"));
	});

	
	// On highlight les zones où l'on peut droper des fichiers
	body_editable_media_event = function() {
		$("body")
			.on({
				// Highlight les zone on hover dragover/dragenter
				"dragover img.editable": function(event) {
					event.stopPropagation();
					$(".editable").off();// Désactive les events sur les contenu éditables
					$("img.editable").addClass("drag-zone");
					$("img.editable").addClass("drag-elem");
				},
				// Clean les highlight on out
				"dragleave img.editable": function(event) {
					event.stopPropagation();
					editable_event();// Active les events sur les contenus éditables
					$("img.editable").removeClass("drag-zone");
					$("img.editable").removeClass("drag-elem");
				}
			});
	}

	// Exécute l'event sur le body pour les images/fichiers
	body_editable_media_event();



	// Icone d'upload + supp du fichier + alt éditable
	$("img.editable").append(function() {
		var alt = $('img', this).attr("alt");
		return "<input type='text' placeholder=\""+ __("Image caption") +"\" class='editable-alt' id='"+ $(this).attr("id") +"-alt' value=\""+ (alt != undefined ? alt : '') +"\">" +
			"<div class='open-dialog-media' title='"+__("Upload file")+"'><i class='fa fa-upload bigger'></i> "+__("Upload file")+"</div>" + 
			"<div class='clear-file' title=\""+ __("Delete") +"\"><i class='fa fa-trash'></i> "+ __("Delete") +"</div>"
	});


	// Rends éditables les images/fichiers
	editable_media_event = function() {
		$("img.editable")
			.on({
				// Highlight la zone on hover
				"dragover img.editable": function(event) {
					event.preventDefault();  
					event.stopPropagation();
					$(this).addClass("drag-over");
					$("img, i", this).addClass("drag-elem");
				},
				// Clean le highlight on out
				"dragleave img.editable": function(event) {
					event.preventDefault();  
					event.stopPropagation();
					$(this).removeClass("drag-over");
					$("img, i", this).removeClass("drag-elem");
				},
				// On lache un fichier sur la zone
				"drop img.editable": function(event) {
					event.preventDefault();  
					event.stopPropagation();
					$(this).removeClass("drag-over");
					$("img, i", this).removeClass("drag-elem");

					// Upload du fichier dropé
					if(event.originalEvent.dataTransfer) upload($(this), event.originalEvent.dataTransfer.files[0], $(this).hasClass('crop') ? 'crop':true);
				},
				// Hover zone upload	
				"mouseenter img.editable": function(event) {
					$(this).addClass("drag-over");
					$("img, i", this).addClass("drag-elem");
					$(".open-dialog-media", this).fadeIn("fast");

					// Affichage de l'option pour supprimer le fichier si il y en a un
					if($("img", this).attr("src") || $("a i", this).length || $(".fa-doc", this).length)
						$(".clear-file", this).fadeIn("fast");

					// Affiche le alt éditable pour les images
					if($("img", this).attr("src")) {
						// Positionnement
						/*$('#'+ $(this).attr("id") +'-alt').css({
							"width": $("img", this).width(),
							"left": $("img", this).parent().parent().offset().left
						});*/

						// Affichage
						$('#'+ $(this).attr("id") +'-alt').css('display','block');;
					}
				},
				// Out
				"mouseleave img.editable": function(event) {
					$(this).removeClass("drag-over");
					$("img, i", this).removeClass("drag-elem");
					$(".open-dialog-media", this).hide();
					$(".clear-file", this).hide();

					// Masque le alt éditable
					$('#'+ $(this).attr("id") +'-alt').css('display','none');;
				},
				// Ouverture de la fenêtre des médias
				"click img.editable": function(event) {
					// Suppression
					if($(event.target).hasClass("clear-file")){
						if($("img", this).attr("src")) $("img", this).attr("src","");// Supp img src
						else {
							$(".fa-doc", this).remove();// Supp le fichier qui vien d'etre ajouté <i>
							$("a", this).remove();// Supp le fichier déjà présent avec lien <a><i>
						} 

						$(".clear-file", this).hide();

						return false;
					}					
					// Edition des alt
					else if($(event.target).hasClass("editable-alt"))
					{
						return false;
					}
					else
					// Ouverture de la fenêtre de média
					{
						// Masque le hover de l'image/fichier sélectionnée
						$(this).removeClass("drag-over");
						$("img, i", this).removeClass("drag-elem");
						$(".open-dialog-media", this).hide();

						// Ouvre la dialog de media
						media(this, 'isolate');
						return false;
					}
				}
			});
	}

	// Exécute l'event sur les images/fichier
	editable_media_event();



	/************** IMAGES BACKGROUND **************/
	
	// Ajout un fond hachuré au cas ou il n'y ai pas de bg 
	$("[data-bg]").addClass("editable-bg");
	$("[data-bg]").append("<div class='bg-tool'><a href=\"javascript:void(0)\" class='open-dialog-media block'>"+__("Change the background image")+" <i class='fa fa-picture'></i></a></div>");

	// S'il y a une image en fond on ajoute l'option de suppression de l'image de fond
	clearbg_bt = "<a href=\"javascript:void(0)\" class='clear-bg' title=\""+__("Delete")+"\"><i class='fa fa-trash'></i></a>";
	$("[data-bg]").each(function() {
		if($(this).data("bg"))
			$(".bg-tool", this).prepend(clearbg_bt);
	});

	// Rends éditables les images en background
	editable_bg_event = function() {
		$("[data-bg]")
			.on({
				"mouseenter.editable-bg": function(event) {// Hover zone upload		
					$("> .bg-tool", this).fadeIn("fast");
				},
				"mouseleave.editable-bg": function(event) {// Out
					$("> .bg-tool", this).fadeOut("fast");
				}
			});		
	}

	// Exécute l'event sur les images
	editable_bg_event();

	// Ouverture de la fenêtre des médias pour changer le bg
	$("body").on("click", ".editable-bg > .bg-tool .open-dialog-media", function() {
		media($(this).parent().parent()[0], 'bg');
	});

	// Supprime l'image de fond
	$("body").on("click", ".editable-bg > .bg-tool .clear-bg", function() {
		$(this).parent().parent().attr('data-bg','').css("background-image","none");
		$(this).remove();
	});



	/************** MODULE DUPLICABLE **************/
	add_module = function(event)
	{
		module = $(event).parent().prev("ul, ol").attr("id");

		// On regarde qu'elle type d’élément éditable existe pour récupérer l'id le plus grand
		if($("#" + module + " li .editable").length) var elem = $("#" + module + " li .editable");
		else if($("#" + module + " li img.editable").length) var elem = $("#" + module + " li img.editable");

		// Crée un id unique (dernier id le plus grand + 1)
		//key = parseInt($("#" + module + " li:first-child .editable").attr("id").split("-").pop()) + 1; Ne tien pas compte de l'ordre des id
		var key = $.map(elem, function(k) {
			return parseInt(k.id.match(/(\d+)(?!.*\d)/));//Récupère le dernier digit de la chaine
		}).sort(function(a, b) {
			return(b-a); // reverse sort : tri les id pour prendre le dernier (le plus grand)
		})[0] + 1;

		// Unbind les events d'edition
		$(".editable").off();
		$("img.editable").off("img.editable");
		$(".editable-href").off(".editable-href");

		// Crée un block
		$("#" + module + " > li:last-child").clone().prependTo("#" + module).show("400", function()
		{
			// Modifie les cles
			$("[class*='editable']", this).each(function() {
				old_key = $(this).attr("id");
				if(old_key == undefined) old_key = $("[id*='" + module + "-']", this).attr("id");
				
				$("#" + old_key).attr({
					id: old_key.replace("-0", "-"+ key),
					src: ""
				});
			});

			// Relance les events d'edition
			editable_event();
			editable_media_event();
			editable_href_event();
		});
	}

	// Rends déplaçables les blocs
	move_module = function() {

		// Change le style du bouton et l'action
		$(".module-bt .fa-move").css("transform","scale(.5)");

		// Désactive l'edition
		$("img.editable").off("img.editable");
		$(".editable").off();

		// Change l'action sur le lien 'move'
		$(".module-bt [href='javascript:move_module();']").attr("href","javascript:unmove_module();");

		// Les rend déplaçable
		$(".module").sortable();
	}

	// Désactive le déplacement des blocs
	unmove_module = function() {

		// Change le style du bouton et l'action
		$(".module-bt .fa-move").css("transform","scale(1)");

		// Change l'action sur le lien 'move'
		$(".module-bt [href='javascript:unmove_module();']").attr("href","javascript:move_module();");

		// Active l'edition
		editable_event();
		editable_media_event();

		// Désactive le déplacement
		$(".module").sortable("destroy");
	}

	// Désactive le lien sur le bloc
	//$(".module li > a").attr("href", "javascript:void(0)").css("cursor","default");

	// Désactive les bulles d'information
	//$(".module li a").tooltip("disable");

	// Désactive les animations pour rendre plus fluide les déplacements et l'edition
	$(".module .fire").css({
		"opacity": "1",
		"transform": "translate3d(0, 0, 0)"
	});
	$(".module .animation").removeClass("animation fire");

	// Ajoute le BOUTON POUR DUPLIQUER le bloc vide de défaut
	$(".module").after("<div class='module-bt'><a href='javascript:move_module();'><i class='fa fa-fw fa-move'></i><span> "+__("Move")+"</span></a> <a href='javascript:void(0)' onclick='add_module(this)'><i class='fa fa-fw fa-plus'></i><span> "+__("Add a module")+"</span></a></div>");
	
	// Force le parent en relatif pour bien positionner les boutons d'ajout
	$(".module-bt").parent().addClass("relative");

	// Ajout de la SUPPRESION au survole d'un bloc
	$(".module > li").append("<a href='javascript:void(0)' onclick='remove_module(this)'><i class='fa fa-cancel absolute none red' style='top: -5px; right: -5px; z-index: 1;' title='"+ __("Remove") +"'></i></a>");

	// Affiche les boutons de suppression
	//$(".module li .fa-cancel").fadeIn();

	// Fonction pour supprimer un bloc
	remove_module = function(that) {
		//console.log($(that).closest("li"));
		$(that).closest("li").fadeOut("slow", function() {
			this.remove();
		});
	};



	/************** CHAMPS INPUT **************/
	
	// Ajout un placeholder s'il n'y en a pas
	$(".editable-input").not("[placeholder]").each(function() {
		$(this).attr("placeholder", $(this).attr("id")).attr("title", $(this).attr("id"));
	});

	// Si le contenu d'un input change on doit sauvegarder
	$(".editable-input").on("change", function(event) {
		tosave();
	});

	// Transforme les inputs hidden en texte visible
	$("input[type='hidden'].editable-input").attr("type","text");

	$(".editable-select.none").show();

	$(".editable-tag.none").slideDown();
	$("img.editable .none").show();
	$(".editable-hidden").slideDown();
	$("label.none").slideDown();



	/************** CHAMPS SELECT **************/
	$(".editable-select").attr("data-option", function(i, data) {
		if(data != undefined)
		{
			// Option sélectionnée
			var selected = $(this).attr("data-selected");

			// Extraction du json
			var json = $.parseJSON(data);		

			// Création des options avec le json
			var html = '';
			$.each(json, function(cle, val){ 				
				html += '<option value="'+ cle +'"'+(cle == selected?" selected":"")+'>'+ val +'</option>';
			});
			
			// Les attribue
			var attr = {};
			$.each(this.attributes, function() { attr[this.name] = this.value; });
			
			// Remplace les select
			$(this).replaceWith($("<select/>", attr).html(html));
		}
	})

	// Change le data-selected dynamiquement
	$(".editable-select").on("change", function(event) {
		$(this).attr("data-selected", $(this).val());
		tosave();
	});



	/************** CHAMPS CHECKBOX **************/
	$(".editable-checkbox, .lucide [for]").not(".lucide #admin-bar [for]").on("click", function(event) {
		if($(this).attr("for")) var id = $(this).attr("for");
		else var id = this.id;

		if($("#"+id).hasClass("fa-ok")) $("#"+id).removeClass("fa-ok yes").addClass("fa-cancel no");
		else $("#"+id).removeClass("fa-cancel no").addClass("fa-ok yes");
	})



	/************** HREF EDITABLE **************/
	
	// Ajoute un input pour ajouter l'url du href
	$("[data-href]").append(function() {
		return "<input type='text' placeholder='"+ __("Destination URL") +"' class='editable-href' id='"+ $(this).data("href") +"' value='"+ $(this).attr("href") +"'>";
	});

	// Rends éditables les liens
	// Note: on utilise animate car l'input est inline-block par défaut avec le fadeIn
	editable_href_event = function(event) {
		$("[data-href]")
			.on({
				"click.editable-href": function(event) {// Supprime l'action de click sur le lien
					//event.stopPropagation();// @todo supp car empèche l'édition des bg
					event.preventDefault();
				},
				"mouseenter.editable-href": function(event) {// Hover zone href		
					$(".editable-href", this).animate({'opacity':'1'}, 'fast');
				},
				"mouseleave.editable-href": function(event) {// Out
					$(".editable-href", this).animate({'opacity':'0'}, 'fast');
				}
			});		
	}

	// Exécute l'event sur les liens éditables
	editable_href_event();

    

	/************** EXECUTION DES FONCTIONS D'EDITION DES PLUGINS **************/
	if(typeof edit !== 'undefined')
	$(edit).each(function(key, funct){
		funct();
	});



	/************** ACTION **************/

	// Si on ferme l'admin
	$("#close").click(function() {	
		reload();
	});


	// On change une info dans un menu select
	$("#admin-bar select").change(function() {
		tosave();// A sauvegarder
	});


	// Si on sauvegarde
	$("#save").click(function() {	
		save();
	});


	// Capture des actions au clavier // keydown keypress
	$(document).on("keydown", function(event) 
	{
		// Si on appuie sur ctrl + s = sauvegarde
		if((event.ctrlKey || event.metaKey)) 
		{
			// Sauvegarde
			if(String.fromCharCode(event.which).toLowerCase() == 's') {
				event.preventDefault();
				save();		
			}
		
			// Active la page
			if(String.fromCharCode(event.which).toLowerCase() == 'q') {
				event.preventDefault();
				if($("#admin-bar #state-content").prop("checked") == false) 
				{
					$("#admin-bar #state-content").prop("checked", true);

					$(".bt.fixed.construction").fadeOut();// Masque la bulle info activation
				}
				else {
					$("#admin-bar #state-content").prop("checked", false);

					$(".bt.fixed.construction").fadeIn();// Affiche la bulle info activation
				}

				tosave();
			}
		}
		// Si on tape du texte dans un contenu éditable on change le statut du bouton sauvegardé
		else if(event.target.className.match(/(editable)/) || event.target.id.match(/^(title|description|permalink)$/)) 
		{	
			// Caractères texte ou 0/96 ou entrée
			if(String.fromCharCode(event.which).match(/\w/) || event.keyCode == 96 || event.keyCode == 13)
			{
				tosave();// A sauvegarder
			}
			else if(event.keyCode == 46 || event.keyCode == 8)// Suppr ou Backspace
			{
				tosave();// A sauvegarder
				
				// Si on est sur une image est que l'on clique sur Supp on supprime l'image du contenu
				if(memo_img) {
					event.preventDefault();
					img_remove();
				}
			}			
		}
	});


	// Si Chrome on supprime les span qui s'ajoutent lors des suppressions de retour à la ligne (ajoute une font-size)
	if($.browser.webkit) {
		$("[contenteditable=true]").on("DOMNodeInserted", function(event) {
			if(
				event.target.tagName == "SPAN"
				&& !$(event.target).hasClass("editable")
				&& !$(event.target).hasClass("editable-tag")
			)
				event.target.outerHTML = event.target.innerHTML;			
		});
	}


	// Désactive le click pour ne pas relancer l'admin
	$(".bt.edit").off("click").fadeOut();

});	
