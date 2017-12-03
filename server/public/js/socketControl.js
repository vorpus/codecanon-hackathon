var socket = io();

socket.on('connect', function() {
  console.log('socket connected to server');
  console.log('sendStatus=true');
  socket.emit('sendStatus', true);
});

var face_detection = false

var cameras = {
  _status: {},
  _info: {},
  _views: {}
};

socket.on('cameraStream', function(obj) {

  let id = obj.id;
  let camInfo = cameras._info[id];

  if (camInfo !== undefined) {
    camInfo.stream.data = obj.stream;
    camInfo.stream.frameCount++;
    camInfo.stream.data.fps = camInfo.stream.avgFPS;
  }
  // alert bar
  $("#alert").empty();
  $("#alert").removeClass('alert-info')


});

socket.on('cameraSnap', function(obj) {
  let id = obj.id;
  let camInfo = cameras._info[id];
  console.log('view', cameras._views[id])
  if (cameras._views[id]) {
    console.log('cameraSnap Finished')
    // alert bar
    $("#alert").empty();
    $("#alert").removeClass('alert-info')

    //show image
    $('#snap').html('<button class="btn btn-primary pull-left" id="downloadsnap">Download</button><button class="btn btn-danger pull-right" id="closesnap">&times;</button><br><br><img id="snapimg" class="img-responsive" src="data:image/jpeg;base64,' + obj.snap + '" />');

    // autodownload Image
    //download("data:image/jpeg;base64,"+obj.snap, "snap.jpeg", "image/jpeg");

    // show buttons after retrieving photo
    showViews(id, ['snap_btn', 'stream_btn']);
  }
});

// displaying metadata
function appendViewsOfObjectKeys(obj, parentView, exceptions) {
  exceptions = exceptions || [];
  for (let key in obj) {
    if (exceptions.indexOf(key) === -1) {
      if (typeof obj[key] === 'object') {
        parentView.append($('<p>').addClass('dataFieldTitle').text(key));
        appendViewsOfObjectKeys(obj[key], parentView);
      } else {
        let view = $('<p>').addClass('dataField').text(key + ': ' + obj[key]);
        parentView.append(view);
      }
    }
  }
}

socket.on('cameraStatus', function(obj) {
  // console.log(obj);
  cameras._status = obj.cameras;

  // update the view model
  var keys = Object.keys(cameras._status);
  for (var i = 0; i < keys.length; i++) {
    var id = keys[i];

    // Build or update the views
    if (cameras._views[id]) {
      updateViews(id);
    } else {
      var camView = buildCameraView(id);
      // Display the view
      $('#cameras').append(camView);
    }

    updateCameraInfo(id);

  }

  // Delete old views from dead cameras
  for (key in cameras._views) {
    if (Object.keys(cameras._status).indexOf(key) === -1) {
      removeCameraView(key);
    }
  }
});

function updateCameraInfo(id) {
  let camStatus = cameras._status[id];
  if (camStatus === undefined) return;

  let camInfo = cameras._info[id];

  if (camInfo === undefined) {
    camInfo = cameras._info[id] = {
      stream: {
        startDate: new Date(),
        drawTimer: undefined,
        frameCount: 0
      }
    }
  }


  if(camStatus.response == 'ready' || camStatus.response === 'connected'){
    // alert bar
    $("#alert").html('');
    $("#alert").removeClass('alert-info')

    // confirm buttons are shown
    showViews(id, ['snap_btn', 'stream_btn', 'start_btn', 'stop_btn']);
  }


  if (camStatus.streaming === 'on') {
    // // alert bar
    $("#alert").html('');
    $("#alert").removeClass('alert-info')

    // hide snap button when streaming
    hideViews(id, ['snap_btn']);
    showViews(id, ['liveview_data', 'camera_menu', 'stream_image', 'facedetection_btn']);


    if (camInfo.stream.drawTimer === undefined) {

      console.log('starting live stream display');
      camInfo.stream.startDate = new Date();
      camInfo.stream.frameCount = 0;
      setCameraDrawTimer(id);

    } else {

      console.log(cameras._status[id]['response']);

      // adjust button color based on stream ON
      $('.streambtn').addClass('btn-danger')
      $('.streambtn').removeClass('btn-info')
      hideViews(id, ['snap_btn']);


      camInfo.stream.secondsElapsed = ((new Date()).getTime() - camInfo.stream.startDate.getTime()) / 1000;
      camInfo.stream.avgFPS = (camInfo.stream.frameCount / camInfo.stream.secondsElapsed).toFixed(2);

    }
  } else {

    // adjust button color based on stream OFF
    $('.streambtn').removeClass('btn-danger')
    $('.streambtn').addClass('btn-info')

    hideViews(id, ['liveview_data', 'camera_menu', 'stream_image', 'facedetection_btn']);

    clearInterval(camInfo.stream.drawTimer);
    camInfo.stream.drawTimer = undefined;
    camInfo.startDate = undefined;
  }

}

function setCameraDrawTimer(camId) {

  let camInfo = cameras._info[camId];
  if (!camInfo) return;

  camInfo.stream.drawTimer = setInterval(function() {
    drawLiveview(camId);
  }, 250);

}

function buildCameraView(id) {
  cameras._views[id] = {};
  var camItem = $('<li>').attr('class', 'camera').attr('id', id);

  // note - children methods are in ORDERED for building out the dom
  var children = {
    // client info
    id: $('<div>').attr('row'),
    sidebar: $('<div>')
      .attr('class', '')
      .append(
        $('<div>')
        .attr('class', 'camera-sidebar')
        .append(
          $('<div>')
          .attr('class', 'camera-details')
          .append(
            $('<div>')
            .attr('class', 'camera-details-name')
            .text('Camera: ' + id)
          ).append(
            $('<div>')
            .attr('class', 'camera-userpic')
            .append(
              $('<i>')
              .attr('class', 'fa fa-camera fa-5x')
            )
          )
        )
      ),
    response: $('<h2>')
      .attr('class', 'camera-details-status')
      .attr('id', 'camera-details-status')
      .text('response'),

    streaming: $('<h2>')
      .attr('class', 'camera-details-error')
      .attr('id', 'camera-details-error')
      .text('streaming'),

    snap_btn: $('<button>')
      .addClass('btn btn-success snapbtn btn-sm')
      .text('Snap')
      .click(function() {
        // hide buttons
        hideViews(id, ['snap_btn', 'stream_btn']);

        // alert bar - Cheese!!!
        $("#alert").html('<b>Cheese!!!</b>');
        $("#alert").addClass('alert-warning')
        setTimeout(function() {
          // alert bar - Loading
          $("#alert").addClass('alert-info')
          $("#alert").removeClass('alert-warning')
          $("#alert").html('<b>LOADING</b>');
        }, 1000)

        console.log('requesting snap');
        socket.emit('cameraCommand', {
          command: 'snap',
          cameraId: id
        });
      }),
    stream_btn: $('<button>')
      .addClass('btn btn-info streambtn btn-sm')
      .text('Stream')
      .click(function() {
        // hideViews(id, ['snap_btn']);
        // alert bar - Loading
        $("#alert").html('<b>LOADING</b>');
        $("#alert").addClass('alert-info')

        // hide/show buttons based on streaming on/off
        if ($(this).hasClass("btn-danger")) {
          $(this).addClass('btn-info')
          $(this).removeClass('btn-danger')
          showViews(id, ['snap_btn', 'stream_btn']);
        } else {
          $(this).addClass('btn-danger')
          $(this).removeClass('btn-info')
          hideViews(id, ['snap_btn']);
        }
        console.log('requesting stream');
        socket.emit('cameraCommand', {
          command: 'stream',
          cameraId: id
        });
      }),
    start_btn: $('<button>')
      .click(function() {
        socket.emit('cameraCommand', {
          command: 'startRecording',
          cameraId: id,
        });
      }),
    stop_btn: $('<button>')
      .click(function() {
        socket.emit('cameraCommand', {
          command: 'stopRecording',
          cameraId: id,
        });
      }),
    br1: $('<br>'),
    facedetection_btn: $('<div>')
      .text('Face Detection')
      .append(
        $('<input>', {
          type: 'checkbox'
        })
        .attr('id', 'face_detection')
        .addClass('btn btn-lg btn-toggle')
        .attr('data-toggle', 'toggle')
        .attr('aria-pressed', 'true')
        .append(
          $('<div>')
          .addClass('handle')
        )
      ),
    stream_image: $('<canvas>')
      .prop({
        width: 480,
        height: 272
      })
      .addClass('streamImage img-responsive')
      .attr('id', 'streamImage'),
    camera_menu: $('<div>')
      .attr('id', 'camera-menu')
      .attr('class', 'camera-menu').append(
        $('<ul>')
        .attr('class', 'nav')
        .append(
          $('<li>')
          .attr('class', 'active')
          .append(
            $('<a>')
            .data('data-toggle', 'tab')
            .attr('href', '#home')
            .html('<i class="fa fa-home"></i>Meta Data')
          )
        )
      ),
    liveview_data: $('<div>')
      .attr('id', 'liveview_data')
      .text(''),
    br3: $('<br>'),
  };

  registerViews(children, id);
  updateViews(id);

  // Add children to parent
  for (var name in children) {
    camItem.append(children[name]);
  }
  return camItem;
}

function registerViews(children, camId) {
  // Store view references
  saveViewReference(children, camId, 'sidebar');
  saveViewReference(children, camId, 'response');
  saveViewReference(children, camId, 'facedetection_btn');
  saveViewReference(children, camId, 'snap_btn');
  saveViewReference(children, camId, 'stream_btn');
  saveViewReference(children, camId, 'streaming');
  saveViewReference(children, camId, 'camera_menu');
  saveViewReference(children, camId, 'stream_image');
  saveViewReference(children, camId, 'liveview_data');
}

function updateViews(id) {
  // Update text of saved views references
  updateSingleView(id, 'response');
  updateSingleView(id, 'streaming');
}

function hideViews(camId, viewNames) {
  let camView = cameras._views[camId];
  if (!camView) return;

  for (let name of viewNames) {
    let view = camView[name];
    if (view) {
      view.hide();
    }
  }
}

function showViews(camId, viewNames) {
  let camView = cameras._views[camId];
  if (!camView) return;

  for (let name of viewNames) {
    let view = camView[name];
    if (view) {
      view.show();
    }
  }
}

function removeCameraView(camId) {
  $('#' + camId).remove();
  delete cameras._views[key];
}

function updateSingleView(id, viewName, suffix = '') {
  let view = cameras._views[id][viewName];
  if (!view) return;
  view.text(makeLabel(viewName, cameras._status[id][viewName], suffix));
}


function makeLabel(label, value, suffix = '') {
  return label + ": " + value + ' ' + suffix;
}

function saveViewReference(children, camId, viewName) {
  cameras._views[camId][viewName] = children[viewName];
}

$('form').submit(function() {
  var cmd = $('#cmd').val();
  socket.emit('command', {
    command: cmd
  });
  return false;
});

function scrollDown() {
  $("html, body").animate({
    scrollTop: $(document).height()
  }, 1);
}

function drawLiveview(camId) {

  // Check for valid ID
  let camInfo = cameras._info[camId];
  let camView = cameras._views[camId];
  let streamData = camInfo.stream.data;
  if (!camView || !camInfo || !streamData) return;


  // Update the dimensions if necessary
  let streamView = camView.stream_image;
  let imageWidth = streamData.width;
  let imageHeight = streamData.height;
  if (streamView.prop('width') !== imageWidth || streamView.prop('height') !== imageHeight) {
    streamView.prop({
      width: imageWidth,
      height: imageHeight
    });
  }

  // Draw on the canvas
  let canvas = streamView.get(0);
  let ctx = canvas.getContext('2d');
  let img = new Image();

  img.src = "data:image/jpeg;base64," + streamData.image;
  img.onload = () => {

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 3;

    // console.log(camInfo.stream);
  };

  img.onerror = (err) => {
    console.log("stream_image.onerror: ", err);
  };

  // update the live view data
  let dataView = camView.liveview_data;
  dataView.empty();
  let exceptions = ['image'];
  appendViewsOfObjectKeys(camInfo.stream.data, dataView, exceptions);

}
////////////////////////////////////////////////////////////////////////////////
$(function() {

  // close snap
  $(document).on('click', '#closesnap', function() {
    $("#snap").html('');
  });

  // download snap
  $(document).on('click', '#downloadsnap', function() {
    //fetch data *
    download("data:image/jpeg;base64," + $("#snapimg").attr('src'), "snap.jpeg", "image/jpeg");
  });
})