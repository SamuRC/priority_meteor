camp_collection = new Meteor.Collection("camp_collection");
user_collection = new Meteor.Collection("user_collection");
filesFS = new CollectionFS('images');


//SERVER
if (Meteor.isClient) {
  //Var para capturar el id de la campaÃ±a para su ediciÃ³n 
  Session.set('campaign_id', '');
  //Var para capturar el id de la promociÃ³n para su ediciÃ³n
  Session.set('promo_id', '');
  Session.set('geozona_id', '');
  //Resultado de las campaÃ±as a listar
  Session.set('results_query', camp_collection.find().fetch());
    
  //Get Camp Data
  get_camp_data = function(){
      st = {activos:0, programados:0, pasados:0 };
      c = 0;
      camp_collection.find().fetch().forEach(function(camp)
      {
        if (camp.tipo == '1')
          st.activos++;
        if (camp.tipo == '2')
          st.programados++;
        if (camp.tipo == '3')
          st.pasados++;
        camp.promos.forEach(function(promo)
          {
            c = c + promo.redimidos;
          });
      });
      console.log(st);
      // DATA
      var data = [{value: st.activos,color:"#46B824"},{value : st.programados,color : "#D5B549"},{value : st.pasados,color : "#556270"}];
      var options = {animationEasing: 'easeOutQuart',percentageInnerCutout: 60,segmentStrokeColor : "#fff"};
      if($("#poststats").length) {
        $('.data .ready').text(st.activos);
        $('.data .pending').text(st.programados);
        $('.data .draft').text(st.pasados);
        $('#cupones-redimidos').text(c);

        var ctx = $("#poststats").get(0).getContext("2d");
        var poststats = new Chart(ctx).Doughnut(data, options);
      }

  }

  //Elimina el element parent  
  delete_tag = function(e){
    e.parentNode.parentNode.removeChild(e.parentNode);
  }

  delete_geozone = function(e){
    var id = Session.get("campaign_id");
    var camp = camp_collection.findOne({_id:id});
    var quadrants = camp.geozonas;
    var geozonas = [];

    for(i in quadrants){
      if(e != quadrants[i].id){
        geozonas.push(quadrants[i]);
      }
    }

    camp_collection.update({_id:camp._id}, {$set: {geozonas: geozonas}}); 
  }

  //ADD PROMOS
  add_promo = function(e){
    var tipo = $("#promoType").editable('getValue').promoType;
    var cantidad = parseInt($("#cantidad").editable('getValue').cantidad);
    var nombre = $("#nombre").editable('getValue').nombre;
    var mensaje = $("#mensaje").editable('getValue').mensaje;
    var fechaInicio = $("#fromDate").editable('getValue').fromDate;
    var fechaFin = $("#toDate").editable('getValue').toDate;
    var descripcion = $("#descripcion").editable('getValue').descripcion;
    //Unique -- id
    var uniq = Math.round(new Date().getTime()/1000.0);
   // var code = generate_code(uniq);
    //Validar fechas
    if(new Date(fechaInicio) >= new Date(fechaFin)){
      openSaveProblemDateialog();
      return false;
    }
    //Obtiene Campana
    var id = Session.get("campaign_id");
    var camp = camp_collection.findOne({_id:id});
    var redimidos = 0;

    if(tipo == '2'){
      cantidad = null;
      redimidos = null;
    }

    //Agrega promociones
    camp.promos.push({
      'id': uniq,
      'nombre': nombre,
      'mensaje': descripcion,
      'tipo': tipo,
      'fechaInicio': fechaInicio,
      'fechaFin': fechaFin,
      'cantidad': cantidad,
      'redimidos': redimidos,
      'sms_text': mensaje
    });

    camp_collection.update({_id: camp._id}, {$set: {promos: camp.promos}});

    //Agregar etiqueta
    var clase = "";
    if(tipo == 1)
      clase='cup';
    else
      clase='des';
    
    var a = '<a id="'+uniq+'" data-type="'+tipo+'" draggable="true" ondragstart="drag(event)" class="promo '+clase+'">'+nombre+'</a>';
    $("#total_promos").append(a); //Actualiza UI
  }

  //Agrega Geozonas
  add_geozone = function(geozonas, items){
    var id = Session.get("campaign_id");
    var camp = camp_collection.findOne({_id:id});
    var geozonas = JSON.parse(geozonas);
    var geozona = [];
    var item = {};
    var custom_sms = {};
    var custom_sms_text = null;
    var redimidos = 0;
    //OBJETO CON LOS CUSTOMS_SMS
    
    for (j in items){
      var quadrant_id = items[j].id;
      item[quadrant_id] = [];

      for(k in items[j].items){ //Itera los dragged_items de los shapes
        var geopromo_id = items[j].items[k].id;
        
        //OBTENER CUSTOM SMS TEXT
        for(i in camp.geozonas){
          if(camp.geozonas[i].id == quadrant_id){
            //Es la primera geopromo que se insertarÃ¡
            if(camp.geozonas[i].items.length == 0){
              item[quadrant_id].push({
                'promo': geopromo_id,
                'custom_sms_text': null,
                'codigo': items[j].items[k].codigo,
                'redimidos': 0
              });
            }else{
              //Recorrer todas los items
              for(z in camp.geozonas[i].items){
                //Se encontrÃ³ custom_sms_text
                if(camp.geozonas[i].items[z].promo == geopromo_id){
                  custom_sms_text = camp.geozonas[i].items[z].custom_sms_text;
                  redimidos = camp.geozonas[i].items[z].reidimidos;
                  break;
                }else{
                  custom_sms_text = null;
                  redimidos = 0;
                }
              }
              //Guardar geopromo
              item[quadrant_id].push({
                'promo': items[j].items[k].id,
                'custom_sms_text': custom_sms_text,
                'codigo': items[j].items[k].codigo,
                'redimidos': redimidos
              });
            }           
          }
        }
      }
    }

    for (var i = 0; i < geozonas.quadrants.length; i++)
      geozona.push({
        'id': geozonas.quadrants[i].id,
        'nombre': geozonas.quadrants[i].name,
        'vertices': geozonas.quadrants[i].vertices,
        'items': item[geozonas.quadrants[i].id]
      })
    //Actualiza geozonas
    camp_collection.update({_id:camp._id}, {$set: {geozonas: geozona}}); 
  }

  //Retorna items de template campanhas
  Template.campanhas.items = function(){
    res = Session.get('results_query');
    if(!this._rendered)
    {
      this._rendered = true;
      res = camp_collection.find().fetch();
    }
    return res;
  }
Template.general.redimidos = function(){
    res = 0;
    // camp_collection.find().fetch().forEach(function(camp)
    // {
    //   camp.promos.forEach(function(promo)
    //     {
    //       res += promo.redimidos;
    //     });
    // });
    return res;
  }
  //Retorna template de template campanha_frm con Login
  Template.login.events({    
    'submit #login_form' : function(e, t){
      e.preventDefault();
      // retrieve the input field values
      var user = t.find('#login-user').value
        , password = t.find('#login-password').value;

        // Trim and validate your fields here.... 

        // If validation passes, supply the appropriate fields to the
        // Meteor.loginWithPassword() function.
        validateLogin(user,password,function(){
            Meteor.loginWithPassword(user, password, function(err){
              if (err){
                console.log(err);
                failedLogin();
              }
          });
        });
         return false; 
      }
  });
  //General
  Template.general.rendered = function() {
    if(!this._rendered) {
      this._rendered = true;
      loadMainScript();
      loadSmoothScroll();
      loadCoreScript();
      get_camp_data();
    }
  }
  Template.general.events({
    'click a#log_out': function(e,t){
        Meteor.logout();
    }
  });
 
  //Editar Promo
  update_promo = function(e){
    Session.set('promo_id', e);
    var id = Session.get("campaign_id");
    var camp = camp_collection.findOne({_id: id});
    for(i in camp.promos){
      if(camp.promos[i].id == e){
        $(".promo-editor #name").editable('setValue', camp.promos[i].nombre);
        //CODIGO PARA VALIDAR FECHAS
        //1. Se debe otener la fecha de inicio y fin de campaÃ±a
        $(".promo-editor #fechaInicio").editable('setValue', new Date(camp.promos[i].fechaInicio));
        $(".promo-editor #fechaFin").editable('setValue', new Date(camp.promos[i].fechaFin));
        $(".promo-editor #descripcion").editable('setValue', camp.promos[i].sms_text);   
        break; 
      }
    }
  }

  //Guardar Cambios de EdiciÃ³n
  save_promo = function(){
    var id = Session.get("campaign_id");
    var promo_id = Session.get("promo_id");
    var camp = camp_collection.findOne({_id: id});
    var fechaInicio = $(".promo-editor #fechaInicio").editable('getValue').fechaInicio;
    var fechaFin = $(".promo-editor #fechaFin").editable('getValue').fechaFin;

    if(new Date(fechaInicio) >= new Date(fechaFin)){
      openSaveProblemDateialog();
      return false;
    }

    for(var i=0; i < camp.promos.length; i++){
      if(camp.promos[i].id == promo_id){
        camp.promos[i].nombre = $(".promo-editor #name").editable('getValue').name;
        camp.promos[i].sms_text = $(".promo-editor #descripcion").editable('getValue').descripcion;
        camp.promos[i].fechaInicio = fechaInicio;
        camp.promos[i].fechaFin = fechaFin;
        camp_collection.update({_id: camp._id}, {$set: {promos: camp.promos}});
        create_json_objects(camp);
        $("#total_promos #"+promo_id).text($(".promo-editor #name").editable('getValue').name);
        break;
      }
    }  
  }

  delete_promo = function(){
    var id = Session.get("campaign_id");
    var promo_id = Session.get("promo_id");
    var camp = camp_collection.findOne({_id:id});
    var promos = [];
    var geozonas = [];

    //Actualizar geozonas
    for(var i=0; i < camp.geozonas.length; i++){
      var items = [];

      for(var j=0; j < camp.geozonas[i].items.length; j++){
        if(camp.geozonas[i].items[j].promo != promo_id){
          items.push({
            'promo': camp.geozonas[i].items[j].promo,
            'custom_sms_text': camp.geozonas[i].items[j].custom_sms_text
          });
        }    
      }

      geozonas.push({
        'id': camp.geozonas[i].id,
        'nombre': camp.geozonas[i].nombre,
        'vertices': camp.geozonas[i].vertices,
        'items': items
      });
    }

    camp.geozonas = geozonas;

    //Actualizar promos
    for(var i=0; i < camp.promos.length; i++){
      if(camp.promos[i].id != promo_id){
        promos.push(camp.promos[i]);
      }else{
        $("#total_promos #"+camp.promos[i].id).remove();
      }
    }

    camp.promos = promos;
    camp_collection.update({_id:camp._id}, {$set: {promos: promos, geozonas: geozonas}});
    create_json_objects(camp);
    $(".close-promo-editor").click();
  }

  update_geopromo = function(promo_id, geozona_id){
    var id = Session.get("campaign_id");
    Session.set('promo_id', promo_id);
    Session.set('geozona_id', geozona_id);

    var promo_id = promo_id;
    var geozona_id = geozona_id;

    var camp = camp_collection.findOne({_id:id});

    for(i in camp.geozonas){
      if(camp.geozonas[i].id == geozona_id){
        for(j in camp.geozonas[i].items){
          if(camp.geozonas[i].items[j].promo == promo_id){
            var custom_sms_text = camp.geozonas[i].items[j].custom_sms_text;
            $("#promo_name").text(camp.geozonas[i].items[j].nombre);
            if(custom_sms_text == "" || !custom_sms_text)
              $("#custom_sms").val("");
            else
              $("#custom_sms").val(custom_sms_text);
            
          }
        }
      }
    }

  }

  save_geopromo = function(){
    var id = Session.get("campaign_id");
    var promo_id = Session.get("promo_id");
    var geozona_id = Session.get("geozona_id");

    var camp = camp_collection.findOne({_id:id});
    var geozonas = [];
    var custom_sms = $("#custom_sms").val();

    for(i in camp.geozonas){
      if(camp.geozonas[i].id == geozona_id){
        for(j in camp.geozonas[i].items){
          if(camp.geozonas[i].items[j].promo == promo_id){
            camp.geozonas[i].items[j] = {
              'promo': camp.geozonas[i].items[j].promo,
              'custom_sms_text': custom_sms
            }
            break;
          }
        }
      }
    }
    camp_collection.update({_id:camp._id}, {$set: {geozonas: camp.geozonas}});
  }

  delete_geopromo = function(){
    var id = Session.get("campaign_id");
    var promo_id = Session.get("promo_id");
    var geozona_id = Session.get("geozona_id");

    var camp = camp_collection.findOne({_id:id});  
    var geozonas = [];

    for(i in camp.geozonas){
      if(camp.geozonas[i].id == geozona_id){
        var items = [];
        for(j in camp.geozonas[i].items){
          if(camp.geozonas[i].items[j].promo != promo_id){
            items.push(camp.geozonas[i].items[j]);
          }
        }
        camp.geozonas[i].items = items;
        break;
      }
    }
    camp_collection.update({_id:camp._id}, {$set: {geozonas: camp.geozonas}});
    create_json_objects(camp);
  }


  //Define eventos del template
  Template.campanha_frm.events({
    'click .btn-nuevo': function(e,t){
    //Obtiene los datos
    var nombre = $("#nombreCampanha").editable('getValue').nombreCampanha;
    var fechaInicio = $("#fechaInicio").editable('getValue').fechaInicio;
    var fechaFin = $("#fechaFin").editable('getValue').fechaFin;
    var image = t.find("#imagen-hidden").files;
    var image_name = $("#imagen").val();
    var descripcion = $("#descripcion").editable('getValue').descripcion;
    var tags = [];
    
    //Validates
    if(nombre=='' || descripcion=='' || !nombre || !descripcion ||fechaInicio=='' || !fechaInicio || fechaFin=='' || !fechaFin || !image_name || image_name==''){
      openSaveProblemDialog();
      return false;
    }else{
      if(new Date(fechaInicio) >= new Date(fechaFin)){
        openSaveProblemDateialog();
        return false;
      }
    }

    //Obtiene los tags
    $("#total_tags div").each(function(k,v){
      tags.push(v.firstChild.innerHTML);
    })

    // Convierte fechas
    var date =  new Date();
    var date_now = (date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate());
      //tipo = [1: Activo, 2: Programado, 3: Pasado]
      var tipo = "";

      if(fechaInicio <= date_now && fechaFin >= date_now){
        tipo = "1"
      }else if(fechaInicio > date_now && fechaFin > date_now){
        tipo = "2"
      }else{
        tipo = "3"
      }
    //GUARDA IMAGEN
    image_token = filesFS.storeFiles(image)[0];

    //Actualiza los campos
    camp_collection.insert(
    {
      nombre:nombre,
      tipo:tipo, 
      fechaInicio:fechaInicio, 
      fechaFin: fechaFin,
      image:{token:image_token, name:image_name}, 
      descripcion:descripcion,
      tags:tags,
      promos: [],
      geozonas: []
    }, function(err, id){
      if(!err){
        $(".btn-save").show();
        $(".btn-nuevo").hide(); 
        openSaveDialog();
        Session.set('campaign_id', id);
        Session.set('results_query', camp_collection.find().fetch());
        get_camp_data();
        $(".data-edit-advanced").slideDown(1000,function(){
          google.maps.event.trigger(core.main_map, 'resize');
          core.main_map.setCenter(new google.maps.LatLng(core.default_lat,core.default_lng))
          core.main_map.setZoom(11);
        });
      }
      else
        console.log(err);
    });
  },

  'click .btn-save': function(e,t){
    //Obtiene los valores
    var id = Session.get("campaign_id");
    var nombre = $("#nombreCampanha").editable('getValue').nombreCampanha;
    var fechaInicio = $("#fechaInicio").editable('getValue').fechaInicio;
    var fechaFin = $("#fechaFin").editable('getValue').fechaFin;
    var image_token = $("#imagen").attr('data-value');
    var image_name = $("#imagen").val();
    var descripcion = $("#descripcion").editable('getValue').descripcion;
    var tags = [];

    //Valida
    if(nombre=='' || descripcion=='' || !nombre || !descripcion ||fechaInicio=='' || !fechaInicio || fechaFin=='' || !fechaFin || image_name=='' || !image_name){
      openSaveProblemDialog();
      return false;
    }
    else
    {
      if(new Date(fechaInicio) >= new Date(fechaFin)){
        openSaveProblemDateialog();
        return false;
      }
    }

    //Obtiene los tags
    $("#total_tags div").each(function(k,v){
      tags.push(v.firstChild.innerHTML);
    })    //$(".data-edit-options-add").show();
    //$(".data-edit-options-edit").hide()

    //Convierte fecha
    var date =  new Date();
    var date_now = new Date(date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate());
      //tipo = [1: Activo, 2: Programado, 3: Pasado]
      var tipo = "";

      if(new Date(fechaInicio) <= date_now && new Date(fechaFin) >= date_now){
        tipo = "1"
      }else if(new Date(fechaInicio) > date_now && new Date(fechaFin) > date_now){
        tipo = "2"
      }else{
        tipo = "3"
      }
    if (!image_token) //Es nuevo e.e
      {
        var image = t.find("#imagen-hidden").files;
        image_token = filesFS.storeFiles(image)[0];
        camp_collection.update(
        {"_id": id}, {$set: { 
          nombre:nombre,
          tipo:tipo,
          fechaInicio:fechaInicio, 
          fechaFin: fechaFin,
          image:{token:image_token, name:image_name},
          descripcion:descripcion,
          tags:tags}
        });
      }else
      //Actualiza la campana
        camp_collection.update(
          {"_id": id}, {$set: { 
            nombre:nombre,
            tipo:tipo,
            fechaInicio:fechaInicio, 
            fechaFin: fechaFin,
            descripcion:descripcion,
            tags:tags}
          });
    Session.set('results_query', camp_collection.find().fetch());
    get_camp_data();
    //clear_maps_objects();
    openSaveDialog();
    //$(".data-edit-options-add").show();
    //$(".data-edit-options-edit").hide();
  },
  'click .btn-cancel': function(e){
    //BORRA CAMPOS IMAGENES
    $("#imagen").val("");
    $("#imagen").attr("data-value",'');
    $("#imagen-hidden").val("");
    loadLocation('#data-search');
    $(".data-edit-options-edit").hide();
    $(".data-edit-advanced").slideUp(200,function(){
      $(".data-edit-info-related").slideUp(200,function(){
        delete_all_overlays();
        $('#data-edit-saved').removeAttr('style')
      });
    });
    $("#nombreCampanha").editable('setValue', '');
    /**FALTA IMPLEMENTAR**/
  },
  'keyup #tag': function(e,t){
    if(e.which === 13){
      var tag = $("#tag").val();
      if(tag != ""){
        var element = '<div class="alert-info"><span>'+tag+'</span><a class="close" onclick="delete_tag(this)">x</a></div>';
        $("#total_tags").append(element);
        $("#tag").val("");
      }
    }
  }

})

Template.campanhas.events({
  'click .view_camp': function(e){  
    delete_all_overlays();
    Session.set('campaign_id', this._id);
    var camp = camp_collection.findOne({_id:this._id});

  //VACIA CAMPOS
  $("#total_tags").html("");
  $("#total_promos").html("");
  $("#data-edit .data-edit-info-related").show();
  $(".btn-save").show();
  $(".btn-cancel").show();
  $(".btn-nuevo").hide();
  $("#imagen").val("");
  $("#imagen").attr("data-value",'');
  $("#imagen-hidden").val("");
  
  //Actualiza UI
  $("#descripcion").editable('setValue',camp.descripcion);
  $("#nombreCampanha").editable('setValue',camp.nombre);
  $("#fechaInicio").editable('setValue', new Date(camp.fechaInicio));
  $("#fechaFin").editable('setValue', new Date(camp.fechaFin));
  if (camp.image) {
    $("#imagen").val(camp.image.name);
    $("#imagen").attr("data-value",camp.image.token);
  }
    //$("#imagen").val(camp.image);

  //Actualiza Tags UI
  for(x in camp.tags){
    var element = '<div class="alert-info"><span>'+camp.tags[x]+'</span><a class="close" onclick="delete_tag(this)">x</a></div>';
    Meteor.flush();
    $("#total_tags").append(element);
  }

  //Actualiza Promos UI
  for(x in camp.promos){
    var clase = "";
    if(camp.promos[x].tipo == 1){
      clase='cup'
    }else{
      clase='des'
    }
    var a = '<a id="'+camp.promos[x].id+'" data-type="'+camp.promos[x].tipo+'" draggable="true" ondragstart="drag(event)" class="promo '+clase+'">'+camp.promos[x].nombre+'</a>';
    $("#total_promos").append(a);
  }

  //Actuaiza Geozonas UI
  create_json_objects(camp);

  $(".data-edit-advanced").slideDown(1000,function(){
      //Actualiza UI
      google.maps.event.trigger(core.main_map, 'resize');
      core.main_map.setCenter(new google.maps.LatLng(core.default_lat,core.default_lng))
      // core.drawing_manager.setMap(core.main_map);
      core.main_map.setZoom(11);
      //Actualiza opciones
      //$(".data-edit-options-add").hide();
      //$(".data-edit-options-edit").show()
    });
},
'click #search_campaign': function(e){
  var word = document.getElementById("word").value;
  var res = [];

  if(word == ""){
    res = camp_collection.find().fetch();
  }else{
    res = camp_collection.find({"nombre": {'$regex': word, "$options": "i"}}).fetch();
  }
  Session.set('results_query', res);
},
'change .compaign_filter': function(e){
  var actives = [];
  var res = [];

  $(".compaign_filter").each(function(k,v){
    if($(this).is(':checked')){
      actives.push(v.value);
    }
  })
  if(actives.length > 0){
    res = camp_collection.find({tipo: {$in: actives} }).fetch();
  }
  Session.set('results_query', res);
}
})

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    adm_user = Meteor.users.findOne({username:'admin'});
    if(!adm_user)
      Accounts.createUser({username: 'admin', password : 'ADMhacom123'});
  });
  camp_collection.allow({
    'insert': function (userId,doc) {
      /* user and doc checks ,
      return true to allow insert */
      return true; 
    },
    'update': function (userId,doc) {
      return true; 
    },
    'remove': function (userId,doc) {
      /* user and doc checks ,
      return true to allow insert */
      return true; 
    },
  });
  filesFS.allow({
    insert: function(userId, file) { return true; },
    update: function(userId, file, fields, modifier) {
      return true;
    },
    remove: function(userId, file) { return true; }
  });
  var handler = {
        "defaultHandler": function (options) {
            return {
                blob: options.blob,
                fileRecord: options.fileRecord
            };
        }
    }
  filesFS.fileHandlers(handler);
}

