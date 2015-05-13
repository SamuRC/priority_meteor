//VARIABLES
    //MAPS
    drawingManager = null;
    selectedShape = null;
    infowindow = null;
    get_infowindow_content_js = null;
    draw_quadrant_list = null;
    print_json_string = null;
    add_listener_on_shape = null;
    clear_maps_objects = null;
    create_json_objects = null;
    delete_all_overlays = null;
    // DRAG FUNCTIONS
    drag= null;
    allowDrop = null;
    drop_infowindow_container = null;
    drop_map = null;
    get_promo_json = null;
    get_promo_template = null;
    dragged_item = null;

    //TEST
    test = null;

    //CORE
    Core = null;
    core = null;
    Quadrant = null;
    Shape = null;
    Util = null;

loadCoreScript = function(){

    $(function(){
        Core = function() {

            this.default_lat = -12.067523813529236;
            this.default_lng = -77.08425170898437;
            this.main_map = null;
            this.quadrant = new Quadrant();
            this.current_infowindow = new google.maps.InfoWindow();
            this.util = new Util();
            this.shape = new Shape();
            this.drawing_manager = null;

            this.polygon_options = {
                fillColor: '#8CB317',
                fillOpacity: 0.3,
                strokeWeight: 1,
                clickable: true,
                editable: true,
                zIndex: 1
            };
        }

        Quadrant = function() {

            this.wrapper_name = '';
            this.list = [];

            this.list_count = function() {
                return this.list.length;
            };

            this.save = function(data) {
                var vreturn = false;
                if (!this.exists(data.id)) {
                    this.list.push(data);
                    vreturn = true;
                } else {
                    for (var i = 0; i < this.list.length; i++) {
                        if (this.list[i].id === data.id) {
                            this.list[i] = data;
                            vreturn = true;
                            break;
                        }
                    }
                }
                return vreturn;
            };

            this.delete = function(id) {
                var index = -1;
                var vreturn = false;
                for (var i = 0; i < this.list.length; i++) {
                    if (this.list[i].id === id) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    this.list.splice(index, 1);
                    vreturn = true;
                }
                return vreturn;
            };

            this.get_quadrant = function(id) {
                var q = null;
                for (var i = 0; i < this.list.length; i++) {
                    if (this.list[i].id === id) {
                        q = this.list[i];
                        break;
                    }
                }
                return q;
            };

            this.exists = function(id) {
                var vreturn = false;
                for (var i = 0; i < this.list.length; i++) {
                    if (this.list[i].id === id) {
                        vreturn = true;
                        break;
                    }
                }
                return vreturn;
            };

            this.list_to_string = function() {

                var wrapper = {
            // 'name': this.wrapper_name,
            'quadrants': []
        };
        
        var json = [];
        for (var i = 0; i < this.list.length; i++) {

            var _coords = this.list[i].getPath().getArray();
            var coords = [];

            $.each(_coords, function(k, v) {
                coords.push({
                    'lat': v.lat(),
                    'lng': v.lng()
                });
            });

            var item = {
                'id': this.list[i].id,
                'name': this.list[i].name,
                'vertices': coords
            };

            json.push(item);
        }
        
        wrapper.quadrants = json;
        return JSON.stringify(wrapper);
    };

    this.clear_list = function() {
        this.list = [];
    };
}

Shape = function() {

    this.selected_shape;

    this.clear_selection = function() {
        if (this.selected_shape) {
            this.selected_shape.setEditable(false);
            this.selected_shape = null;
        }
    };

    this.set_selection = function(shape) {
        this.clear_selection();
        this.selected_shape = shape;
        shape.setEditable(true);
    };

    this.get_selection = function() {
        return this.selected_shape;
    };

    this.delete_selected_shape = function() {
        if (this.selected_shape) {
            selectedShape.setMap(null);
        }
    };
}

Util = function() {
    this.make_id = function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 10; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };
}

if (!google.maps.Polygon.prototype.getBounds) {

    google.maps.Polygon.prototype.getBounds = function(latLng) {

        var bounds = new google.maps.LatLngBounds();
        var paths = this.getPaths();
        var path;

        for (var p = 0; p < paths.getLength(); p++) {
            path = paths.getAt(p);
            for (var i = 0; i < path.getLength(); i++) {
                bounds.extend(path.getAt(i));
            }
        }

        return bounds;
    };

}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elt /*, from*/) {
        var len = this.length >>> 0;
        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) from += len;

        for (; from < len; from++) {
            if (from in this && this[from] === elt) return from;
        }
        return -1;
    };
}

core = new Core();


google.maps.event.addDomListener(window, 'load', initialize({"lat": 0, "lng": 0}));

$('.data-edit-advanced').on('click', '#btn_save_quadrant', function() {
        //Fix para que el nombre siempre este
        if  ($('#quadrant_name').editable('getValue').quadrant_name == undefined && $('#quadrant_name').text() != 'Ingrese nombre de geozona')
            $('#quadrant_name').editable('setValue', $('#quadrant_name').text());
        //Validación que el nombre no este vacio.
        var shape_name_x = $('#quadrant_name').editable('getValue').quadrant_name;
        var shape_name_txt = $('#quadrant_name').text();
        if(typeof shape_name_x == 'undefined' && shape_name_txt == 'Ingrese nombre de Geozona'){
            alert("Debe ingresar un nombre");
        }else{
            if(shape_name_x == '' && shape_name_txt == 'Empty'){
                alert("Debe ingresar un nombre");
            }else{
                var current_shape = core.shape.get_selection();
                current_shape.name = shape_name_x;
                core.quadrant.save(current_shape);
                core.drawing_manager.setDrawingMode(null);
                core.current_infowindow.setMap(null);
                print_json_string(core.quadrant.list_to_string());
                draw_quadrant_list(core.quadrant.list);
                add_geozone(core.quadrant.list_to_string(), core.quadrant.list);
                current_shape.modified = false;
            }
        }
})

$('.data-edit-advanced').on('click', '#btn_delete_quadrant', function() {
    var id = $(this).parents('.promo-chooser').attr('data-shape-id');
    var is_saved = false;

    for(i in core.quadrant.list){
        if(core.quadrant.list[i].id == id){
            is_saved = true;
            break;
        }
    }

    if (id) {
            //var q = core.quadrant.get_quadrant(id);
            var q = core.shape.get_selection();

            if (q !== null) {
                if(is_saved){
                    if (confirm('¿Desea eliminar el quadrante?')) {
                        delete_geozone(id);
                        core.quadrant.delete(id);
                    }else{
                        core.current_infowindow.setMap(null);
                        return false;
                    }
                }

                core.current_infowindow.setMap(null);
                q.setMap(null);
                print_json_string(core.quadrant.list_to_string());
                draw_quadrant_list(core.quadrant.list);
            }
        }
    });

// DRAG MAPS
google.maps.event.addListener(window, 'dragend', function() { alert('map dragged'); } );

function initialize(location) {
    var lat, lng;
    if (location.lat === 0 && location.lng === 0) {
        lat = core.default_lat;
        lng = core.default_lng;
    } 
    else {
        lat = location.lat;
        lng = location.lng;
    }

    var mapOptions = {zoom: 11,
        center: new google.maps.LatLng(lat, lng),
        navigationControl: true,
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        navigationControlOptions: {position: google.maps.ControlPosition.TOP_LEFT,
            style: google.maps.NavigationControlStyle.ROADMAP
        },
        disableDoubleClickZoom: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    core.main_map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);

    core.drawing_manager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYGON
            ]
        },
        polygonOptions: core.polygon_options
    });
    core.drawing_manager.setMap(core.main_map);
    core.quadrant.shapes = [];
    google.maps.event.addListener(core.drawing_manager, 'overlaycomplete', function(e) {
        if (e.type != google.maps.drawing.OverlayType.MARKER) {
                // Switch back to non-drawing mode after drawing a shape.
                core.drawing_manager.setDrawingMode(null);

                // Add an event listener that selects the newly-drawn shape when the user mouses down on it.
                var newShape = e.overlay;
                newShape.type = e.type;
                newShape.id = core.util.make_id();
                newShape.items = []

                google.maps.event.addListener(newShape, 'click', function(ev) {
                    var area = parseInt(google.maps.geometry.spherical.computeArea(newShape.getPath()));
                    if(area > 100000){
                        notificar(ERRORS.maps.geozone_too_big);
                    }else{
                        core.shape.set_selection(newShape);
                        content = get_infowindow_content_js(this);
                        core.current_infowindow.setContent(content);
                        core.current_infowindow.setPosition(ev.latLng);
                        core.current_infowindow.open(core.main_map);
                    }
                });
                core.quadrant.shapes.push(newShape);
                core.shape.set_selection(newShape);
            }
        });

     google.maps.event.trigger(core.main_map, "resize");
     core.main_map.setCenter(new google.maps.LatLng(core.default_lat,core.default_lng))
     core.main_map.setZoom(11);
}

clear_maps_objects = function() {
    var list = core.quadrant.list;
    for (var i = 0; i < list.length; i++) {
        list[i].setMap(null);
    }
    core.current_infowindow.setMap(null);
}

create_json_objects = function(camp) {
  var quadrants = camp.geozonas;

  if (quadrants !== null) {
    clear_maps_objects();
    core.quadrant.clear_list();

    for(i in quadrants){
        var quadrant_id = quadrants[i].id;   
        var nombre = quadrants[i].nombre;
        var polygon_coords = [];
        var items_array = [];

        for (j in quadrants[i].vertices){
            polygon_coords.push(new google.maps.LatLng(quadrants[i].vertices[j].lat, quadrants[i].vertices[j].lng));
        }

        quadrants[i].items.forEach(function(quadrant){
            var promo_id = quadrant.promo;

            for(i in camp.promos){
                if(camp.promos[i].id == promo_id){
                    var promo = camp.promos[i];
                    var promo_class = "des";
                    if(promo.tipo == 1){
                      promo_class = "cup";
                    }   

                  items_array.push({
                    'class': promo_class,
                    'id': promo_id,
                    'name': promo.nombre,
                    'promo_type': "1"
                })
              }                                   
          }
      });

      var options = core.polygon_options;
      options.paths = polygon_coords;

      var shape = new google.maps.Polygon(options);

      shape.id = quadrant_id;
      shape.name = nombre;
      shape.items = items_array;

      shape.setMap(core.main_map);
      core.quadrant.save(shape);
      add_listener_on_shape(shape);
  }  

  print_json_string(core.quadrant.list_to_string());
  draw_quadrant_list(core.quadrant.list);
  core.drawing_manager.setDrawingMode(null);
}
}
delete_all_overlays = function()
{
    core.quadrant.shapes.forEach(function(ob)
        {
            ob.setMap(null);
            delete ob;
        });
}


add_listener_on_shape = function(shape) {
    google.maps.event.addListener(shape.getPath(), 'set_at', function() {
        //ITS edited
        shape.modified = true;
        var area = parseInt(google.maps.geometry.spherical.computeArea(shape.getPath()));
        if(area > 100000){
            shape.setOptions({fillColor:'BB4442'})
        }else{
            shape.setOptions({fillColor:'8CB317'})
        }
    });

    google.maps.event.addListener(shape.getPath(), 'insert_at', function() {
        shape.modified = true;
        //ITS edited
        var area = parseInt(google.maps.geometry.spherical.computeArea(shape.getPath()));
        if(area > 100000){
            shape.setOptions({fillColor:'BB4442'})
        }else{
            shape.setOptions({fillColor:'8CB317'})
        }
    });
  google.maps.event.addListener(shape, 'click', function(ev) {
    var area = parseInt(google.maps.geometry.spherical.computeArea(shape.getPath()));
    if(area > 100000){
        notificar(ERRORS.maps.geozone_too_big);
    }else{
        core.shape.set_selection(shape);
        var content = get_infowindow_content_js(shape,shape.modified);
        core.current_infowindow.setContent(content);
        core.current_infowindow.setPosition(ev.latLng);
        core.current_infowindow.open(core.main_map);
    } 
});
};

function get_infowindow_content_html(id, name) {
    var contentString = $(".info-window").html();
    return contentString;
}

get_infowindow_content_js = function(shape, editable) {
    st = "";
    xedit = "";

    shape.items.forEach(function(item){
        st += get_promo_template(item);
    });
    contentString = '';
    contentString +='<div class="info-window promo-container" style="background-color:white !important;"> <div class="promo-chooser" data-shape-id="'+shape.id+'">';
    if(typeof shape.name == 'undefined' || shape.name == ''){
        xedit = 'data-value="">Ingrese nombre de Geozona';
    }else{
        xedit = 'data-value="'+shape.name+'">'+shape.name;
    }
    if (editable == null || editable == undefined)
        editable = false

    disabled = '';
    if (!editable)
        disabled = 'disabled=disabled';

    contentString +='<h4 style="margin-bottom:0px !important">Cuadrante: <a href="#" id="quadrant_name" data-type="text" class="editable-quadrant" '+xedit+'</a></h4>';
    contentString +='<div class="info-cont" ondrop="drop_infowindow_container(event)" ondragover= "allowDrop(event)"> ';
    contentString += st;
    contentString +='</div> <div style="text-align:right;"> <button id="btn_delete_quadrant" class="btn btn-sm btn-danger" ';
    contentString +=' type="button" style= "padding:5px; margin-right: 5px">Eliminar</button><button id="btn_save_quadrant" ';
    contentString +=' class="btn btn-sm btn-primary btn-disabled" type="button" style="padding:5px" '+ disabled+'>Guardar</button> </div></div> ';
    contentString +='<div class="promo-editor" hidden> <form class="form-horizontal" action="#"> <fieldset> <legend>'+ shape.name +' -  Edición <strong id="promo_name"></strong></legend>';
    contentString +='<div class="control-group"> <label for="toMessage"';
    contentString +=' class="control-label">Mensaje</label> <div class="controls" style="margin-left: 90px !important;"> <textarea rows="4" id="custom_sms" style="width: 295px !important;"></textarea> </div> </div> <div class="control-group options">';
    contentString +='<div class="controls" style="text-align: right; padding-top:8px;"><button id="save_geopromo" class="btn btn-success" title="Guardar"><i class="icon-ok"></i></button><button id="delete_geopromo" class="btn btn-danger" title="Eliminar">';
    contentString +='<i class="icon-trash"></i></button><button id="cancel_geopromo" class="btn btn-primary" title="Cancelar"><i class=" icon-ban-circle"></i></button></div></div></fieldset></form></div>';
    return contentString;
}

print_json_string = function (str) {
    $('#json_results').val(str);
}

draw_quadrant_list = function(list) {

    $('#quadrants_list').html('');

    for (var i = 0; i < list.length; i++) {
        var a = $('<a>', {
            'href': 'javascript:;',
            'class': 'lnk_open_infowindow',
            'data-id': list[i].id
        }).html('Cuadrant ' + (i+1));

        $('<li>').append(a).appendTo('#quadrants_list');
    }
}

    //DRAG FUNCTIONS
    drag = function(ev)
    {
        google.maps.event.addListenerOnce(core.main_map, "mousemove", function(evento) {
            if(dragged_item){
                notificar(ERRORS.maps.invalid_position);
                dragged_item = false;
            }
        });
        dragged_item = get_promo_json(ev.target);
    }

    allowDrop = function(ev)
    {
        ev.preventDefault();
    }

    drop_infowindow_container = function(ev)
    {
        if (dragged_item) {
            shape_id = ev.target.parentElement.attributes[1].value;
            shape_exist = false;
            geopromo_id = dragged_item.id;
            geopromo_exist = false;

            core.quadrant.list.forEach(function(shape)
            {
                if(shape.id == shape_id)
                {
                    shape_exist = true;
                    shape.items.forEach(function(geopromo){
                        if(geopromo.id == geopromo_id){
                            geopromo_exist = true;
                        }
                    })

                    if(!geopromo_exist){
                        dragged_item.codigo = generate_code();
                        shape.items.push(dragged_item);
                        add_geozone(core.quadrant.list_to_string(), core.quadrant.list);
                        notificar(ERRORS.maps.none);
                        tp = get_promo_template(dragged_item);
                        $("."+ev.target.className).append(tp);    
                    }
                }
            });
                    
            if(!shape_exist){
                notificar(ERRORS.maps.geozone_not_saved);
            }else{
                if(geopromo_exist){
                    notificar(ERRORS.maps.promo_already_added);
                }
            }
            ev.preventDefault();
            dragged_item = null;
        }
    }

    drop_map = function(ev)
    {
        ev.preventDefault();
    }

    // Create temp json_results
    get_promo_json =  function(target)
    {
        item_promo ="des";
        promo_type = $("#"+target.id).attr("data-type");
        name = $("#"+target.id).text();
        if(parseInt(promo_type) == 1)
            item_promo = "cup";
        return { 'class':item_promo, 'id': target.id, 'promo_type':promo_type,'name':name};
    }

    get_promo_template = function(promo)
    {
        return '<a draggable="true" id="'+ promo.id+'" ondragstart="drag(event)" data-promo="'+promo.promo_type+'" class="promo '+promo.class+'" data-promo="'+promo.promo+'">'+promo.name+'</a>';
    }
});

}

  generate_code = function(){
    var abc = new Array('0','a','b','c','d','1','e','f','g','2','h','i','3','j','k','4','l','m','5','n','6','o','p','7','q','r','8','s','t','u','9','v','w','x','y','z','0');
    var hash = '';
    var limit = 6;
    getRandom = function(){return parseInt(Math.random() * (37));}
    for (var i = limit - 1; i >= 0; i--){
      letter =  abc[getRandom()];
      hash += letter;
    };
    return hash;
  }