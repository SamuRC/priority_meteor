closeDialog = null;
closeConfirmPromoDeleteDialog = null;
openAddPromoDialog = null;
openSaveProblemDialog = null;
openSaveProblemDateialog = null;
showNotificationDialog = null;
showConfirmPromoDeleteDialog = null;
openDialog = null;
notificar = null;
loadSmoothScroll = null;
loadLocation = null;
loadGraph = null;

loadMainScript = function(){
$(function(){
//MODAL EVENTS
    closeDialog = function(){
        $("#data-edit-add-promo a").not("#promoType, #cantidad").editable('setValue', null);
        Avgrund.hide();
    }
    closeSaveDialog = function(){
        $("#data-edit-add-promo a").not("#promoType, #cantidad").editable('setValue', null);
        Avgrund.hide();
        loadLocation('#data-edit');
    }
    openSaveDialog = function(){
        Avgrund.show("#data-edit-saved")
        // $("#promoType").editable('setValue', 1);
        // $("#cantidad").parent().parent().show();
    }
    openAddPromoDialog = function(){
        Avgrund.show("#data-edit-add-promo")
    }
    openSaveProblemDialog = function(){
        Avgrund.show("#data-edit-saved-problem")
    }
    openSaveProblemDateialog = function(){
        Avgrund.show("#data-edit-saved-problem-date")  
    }

    showNotificationDialog = function(){
        $("#data-edit-confirm-delete").children(".confirm").hide();
        $("#data-edit-confirm-delete").children(".notification").show();
    }
    showConfirmPromoDeleteDialog = function(){
        Avgrund.show("#data-edit-confirm-delete");
    }    
    closeConfirmPromoDeleteDialog = function(){
        $("#data-edit-confirm-delete").children(".confirm").show();
        $("#data-edit-confirm-delete").children(".notification").hide();   
        Avgrund.hide();
    }
//FORM PREVENT DATA
    $("form").submit(function(ev)
    {
        ev.preventDefault();
    });

//MAP EVENTS
    $("body").delegate(".promo-container .promo","dblclick",function(){
        var promo_id = this.id; 
        if($(this).parents(".box-promos").length == 1){
            update_promo(promo_id);
        }else{
            update_geopromo(promo_id, core.shape.get_selection().id);
        }
        dad = $(this).parents(".promo-container");
        $(dad).children(".promo-chooser").toggle();
        $(dad).children(".promo-editor").toggle();
    });

    $(".promo-container .save-promo-editor").click(function(){
        save_promo();
        dad = $(this).parents(".promo-container");
        $(dad).children(".promo-chooser").toggle();
        $(dad).children(".promo-editor").toggle();
    });
    
    $(".promo-container .close-promo-editor").click(function(){
        dad = $(this).parents(".promo-container");
        $(dad).children(".promo-chooser").toggle();
        $(dad).children(".promo-editor").toggle();
    });

    $(".promo-container .delete-promo-editor").click(function(){
       showConfirmPromoDeleteDialog();
    });

    $(".data-edit-advanced").on("click", "#save_geopromo", function(e){
        e.preventDefault();
        save_geopromo();
        core.current_infowindow.setMap(null);
    });   

    $(".data-edit-advanced").on("click", "#delete_geopromo", function(e){
        e.preventDefault();
        delete_geopromo();
        core.current_infowindow.setMap(null);
    }); 

    $(".data-edit-advanced").on("click", "#cancel_geopromo", function(e){
        e.preventDefault();
        core.current_infowindow.setMap(null);
    }); 

//FORMS
    $("body").delegate("form","submit",function(ev)
        {
            ev.preventDefault();
        });
//XEDITABLE
    $.fn.editable.defaults.mode = 'inline';
    // $(".data-edit-info a").editable();
    $(".editable-enabled").editable();
    $("#data-edit").editable({
        selector:'a.editable-click'
    });

    $("#nombreCampanha").editable({
        validate: function(value){
            if(value==""){
                return 'Debe ingresar un nombre para la campaña';
            }else{
                if ($("#data-edit .data-edit-info-related").is(":hidden")) 
                    {
                        $(".data-edit-info-related a.editable-click").editable('setValue', "");
                        $("#total_tags").html("")
                        $(".btn-nuevo").show();
                        $("#imagen").val("");
                        $("#imagen").attr("data-value",'');
                        $("#imagen-hidden").val("");
                        $(".btn-cancel").show();
                        $("#data-edit .data-edit-info-related").show();
                        $('html, body').animate({scrollTop: $(document).height()-$(window).height()}, 800);
                    };
            }
        }
    });
    $("#fechaFin").editable({
        validate: function(fechaFin){
            if (!fechaFin) return 'Debe ingresar una fecha';
            var fechaInicio = $("#fechaInicio").editable('getValue').fechaInicio;
            if(new Date(fechaInicio) >= fechaFin){
              return 'La fecha de fin debe ser mayor a la fecha de inicio';
            }
        }
    });
    $("#fechaInicio").editable({
        validate: function(fechaInicio){
            if (!fechaInicio) return 'Debe ingresar una fecha';
            var fechaFin = $("#fechaFin").editable('getValue').fechaFin;
            if(fechaInicio >= new Date(fechaFin)){
              return 'La fecha de inicio debe ser menor a la fecha fin';
            }
        }
    });

    $(".editable-click").editable({
        validate: function(value){
            if (!value) return 'Debe ingresar un valor correcto';
        }
    });

    $(".data-edit-advanced").editable({
        selector:'a.editable-quadrant',
        validate: function(value){
            if (value == '' || value==undefined || value == null){
                $('#btn_save_quadrant').attr('disabled','disabled');
                return 'Debe indicar un nombre';}
            else
            {
                $('#btn_save_quadrant').removeAttr('disabled');
            }
        }
    });

    $('#promoType').editable({
        value: 1,
        source: [
              {value: 1, text: 'Cupón'},
              {value: 2, text: 'Descuento'}
           ],
        validate: function(value){
            if (value == 1){
                $("#cantidad").parent().parent().show();
            }else{
                $("#cantidad").parent().parent().hide();
            }
        }
    });

//bootstrap-filestyle
    $("#data-edit").on('change','input#imagen-hidden[type="file"]',function(ev){
        $("#imagen").attr("data-value",'');
        var arr = this.value.split('\\');
        $("input#imagen").val(arr[arr.length-1]);
        // $("#imagen-hidden").val("");
    });


//pines-notify
    $.pnotify.defaults.styling = "bootstrap";
    $.pnotify.defaults.history = false;
    $.pnotify.defaults.delay = 700;

    notificar = function (type) {
        opts = {
            title: "Intenta nuevamente",
            text: "Al parecer la accion no ocurrio como se planeo.",
            addclass: "stack-bottomright",
            stack: pnotify.stack_bottomright,
            sticker:false
        };
        switch (type) {
        case 0:
            opts.title = "Agregado";    
            opts.text = "La promoción fue agregada exitosamente.";
            opts.type = "success";
            break;
        case 1:
            opts.title = "Oh No";
            opts.text = "Debe guardar la geozona antes de agregar promociones.";
            opts.type = "error";
            break;
        case 2:
            opts.title = "Ups, Promoción repetida";
            opts.text = "Ya existe esa promoción.";
            opts.type = "error";
            break;
        case 3:
            opts.title = "Wraaang, Geozona invalida";
            opts.text = "Debe arrastrar la promoción a una geozona.";
            opts.type = "error";
            break;
        case 4:
            opts.title = "Geozona demasiado grande";
            opts.text = "El área de la geozona no debe exceder los 50 km2.";
            opts.type = "error";
            break;
        }
        $.pnotify(opts);
    }
    
});
}
//pines-notify-stack-fix
pnotify = {
    stack_topleft : {"dir1": "down", "dir2": "right", "push": "top"},
    stack_bottomleft : {"dir1": "right", "dir2": "up", "push": "top"},
    stack_custom : {"dir1": "right", "dir2": "down"},
    stack_custom2 : {"dir1": "left", "dir2": "up", "push": "top"},
    stack_bar_top : {"dir1": "down", "dir2": "right", "push": "top", "spacing1": 0, "spacing2": 0},
    stack_bar_bottom : {"dir1": "up", "dir2": "right", "spacing1": 0, "spacing2": 0},
    stack_bottomright: {dir1: "up", dir2: "left", firstpos1: 25, firstpos2: 25, animation: true,addpos2: 0, nextpos1: 25, nextpos2: 25}
}

//ERRORS
ERRORS = {
    maps:{
        none:0,
        geozone_not_saved : 1,
        promo_already_added :2,
        invalid_position:3,
        geozone_too_big : 4
    }
}

loadSmoothScroll = function()
{
    $(function() {
      $("body").on('click','a[href*=#]:not([href=#])',function(){
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
          var target = $(this.hash);
          target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
          if (target.length) {
            $('html,body').animate({
              scrollTop: target.offset().top
            }, 700);
            return false;
          }
        }
      });
    });
}

loadLocation = function(hash){
          var target = $(hash);
          target = target.length ? target : $('[name=' + hash.slice(1) +']');
          if (target.length) {
            $('html,body').animate({
              scrollTop: target.offset().top
            }, 700);
          }
}

loadGraph = function(){
    var options = {
  animationEasing: 'easeOutQuart',
  percentageInnerCutout: 60,
  segmentStrokeColor : "#fff"
}
var data = [
      {
        value: parseInt($('.ready').text()),
        color:"#46B824"
      },
      {
        value : parseInt($('.pending').text()),
        color : "#D5B549"
      },
      {
        value : parseInt($('.draft').text()),
        color : "#556270"
      }
    ]

if($("#poststats").length) {
    var ctx = $("#poststats").get(0).getContext("2d");
    var poststats = new Chart(ctx).Doughnut(data, options);
}
}