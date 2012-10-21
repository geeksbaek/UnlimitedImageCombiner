window.onload = init;
window.onresize = resizeEvent;

function init() {
  // 폭 버튼을 누르면 이미지 합침
  [].forEach.call($('#radio>button'), function (element) {
    $(element).bind('click', function () {
      if (window.UIC.files != undefined && window.UIC.files.length > 1) {
        combineImage();
      }
    });
  });

  // 수동 폭 입력 폼에서 엔터를 누르면 이미지 합침
  $('#width').keyup(function (e) {
    if (window.UIC.files != undefined && window.UIC.files.length > 1) {
      if (e.keyCode == 13 && $('#width').val() != '') {
        combineImage();
      }
    }
  });

  $('#width').keydown(function (event) {
    // Allow: backspace, delete, tab, escape, and enter
    if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
      // Allow: Ctrl+A
        (event.keyCode == 65 && event.ctrlKey === true) ||
      // Allow: home, end, left, right
        (event.keyCode >= 35 && event.keyCode <= 39)) {
      // let it happen, don't do anything
      return;
    }
    else {
      // Ensure that it is a number and stop the keypress
      if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
        event.preventDefault();
      }
    }
  });

  window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
  window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;
  navigator.saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;

  $('.close').click(function () { $(this).parent().fadeOut(200); });
  $('#introduce_message').center().fadeIn(300);

  $('.navbar-inner').css('-webkit-transition', 'height .5s ease 0s');
  $('.navbar-inner').css('-moz-transition', 'height .5s ease 0s');
  $('.navbar-inner').css('transition', 'height .5s ease 0s');

  $('#clear').bind('click', allClear);
  $('#combine').bind('click', combineImage);
  $('#download').bind('click', download);

  allClear();
}

function uploadEvent(input) {
  if (input.length == 0) return;

  for (var i = 0, max = input.length; i < max; i++) {
    $('#preview').append('<img>');
  }

  [].forEach.call(input, function (element) {
    UIC.files.push(element);
    addPreview(element);
  });

  UIC.loader.start();

  $('#clear').removeClass('disabled');
  $('#combine').removeClass('disabled');
  $('.navbar-inner').css('height', '175px');
}

function addPreview(_files) {
  var imgaeURL = URL.createObjectURL(_files);
  var pxImage = new PxLoaderImage(imgaeURL);
  pxImage.imageNumber = UIC.count++;
  UIC.loader.add(pxImage);
}

function allClear() {
  $('#content>canvas').remove();
  $('#preview>img').remove();
  $('#buttons>button').addClass('disabled');
  $('.navbar-inner').css('height', '50px');

  window.UIC = {
    files: [],
    maxWidth: Number.MIN_VALUE,
    minWidth: Number.MAX_VALUE,
    loader: new PxLoader,
    count: 0,
    dragSrcEl: null
  };

  UIC.loader.addProgressListener(function (e) {
    UIC.maxWidth = Math.max(UIC.maxWidth, e.resource.img.width);
    UIC.minWidth = Math.min(UIC.minWidth, e.resource.img.width);

    var img = $('#preview>img')[e.resource.imageNumber];

    $(img).attr('src', e.resource.img.src);
    $(img).data('img', e.resource.img);

    img.addEventListener('dragstart', handleDragStart, false);
    img.addEventListener('dragenter', handleDragEnter, false);
    img.addEventListener('dragover', handleDragOver, false);
    img.addEventListener('dragleave', handleDragLeave, false);
    img.addEventListener('drop', handleDrop, false);
    img.addEventListener('dragend', handleDragEnd, false);
  });
}

function handleDragStart(e) {
  $(this).css('opacity', '0.4');
  UIC.dragSrcEl = this;
}

function handleDragEnter(e) {
  $(this).addClass('over');
}

function handleDragOver(e) {
  if (e.preventDefault) { e.preventDefault(); }
  return false;
}

function handleDragLeave(e) {
  $(this).removeClass('over');
}

function handleDrop(e) {
  if (e.stopPropagation) { e.stopPropagation(); }

  if (UIC.dragSrcEl != this) {
    var src = $(UIC.dragSrcEl).attr('src');
    var img = $(UIC.dragSrcEl).data('img');

    $(UIC.dragSrcEl).attr('src', $(this).attr('src'));
    $(UIC.dragSrcEl).data('img', $(this).data('img'));

    $(this).attr('src', src);
    $(this).data('img', img);
  }

  return false;
}

function handleDragEnd(e) {
  [].forEach.call($('#preview>img'), function (element) {
    $(element).css('opacity', '1');
    $(element).removeClass('over');
  });
}

function combineImage() {
  if (UIC.files.length == 0) return;

  $('.alert').hide();
  $('#content>canvas').remove();

  var heights = [];
  var devideValue = $('#radio>.active').text() == '수동 폭' ?
    $('#width').val() : $('#radio>.active').text() == '자동 최대 폭' ?
    UIC.maxWidth : UIC.minWidth;
  var gap = 2;
  var sumHeight = [{ height: 0, count: 0 }];
  var sumHeightIndex = 0;
  var realSumHeight = 0;
  var images = $('#preview>img');

  // 이미지들의 최종 높이 = realSumHeight
  // 캔버스의 개수 = sumHeightIndex
  // 각 캔버스의 높이와 캔버스에 들어갈 이미지의 개수 = sumHeight
  for (var i = 0, max = images.length; i < max; i++) {
    heights.push($(images[i]).data('img').height / ($(images[i]).data('img').width / devideValue));

    if (sumHeight[sumHeightIndex].height + heights[i] + gap > 32000) { // 여기
      sumHeightIndex++;
      sumHeight[sumHeightIndex] = { height: 0, count: 0 };
    }

    sumHeight[sumHeightIndex].height += heights[i] + gap; // 여기
    sumHeight[sumHeightIndex].count++;
    realSumHeight += heights[i];
  }

  for (var i = 0; i <= sumHeightIndex; i++) {
    $('#content').append('<canvas />');
  }

  var canvas = document.querySelectorAll('#content>canvas');
  var ctx = [];

  [].forEach.call(canvas, function (element, index) {
    ctx[index] = element.getContext('2d');
  });

  for (var i = 0, totalCount = 0; i < canvas.length; i++) {
    canvas[i].width = devideValue;
    canvas[i].height = sumHeight[i].height - gap; // 여기

    ctx[i].save();
    ctx[i].fillStyle = 'white'; // 배경색
    ctx[i].fillRect(0, 0, canvas[i].width, canvas[i].height);
    ctx[i].restore();

    for (var j = 0, max = sumHeight[i].count, accrueHeight = 0; j < max; j++) {
      ctx[i].drawImage($(images[totalCount]).data('img'), 0, accrueHeight, devideValue, heights[totalCount]);
      accrueHeight += heights[totalCount] + (j == max - 1 ? 0 : gap); // 여기
      totalCount++;
    }
  }

  if (sumHeightIndex > 0) {
    $('#success_multiple>p').first().text("결과물의 높이가 " + parseInt(realSumHeight) +
      "px로, 저희가 지원하는 단일 파일 최대 높이인 32000px을 초과했기 때문에 " +
      (sumHeightIndex + 1) + "개의 파일로 분할되어 합쳐졌습니다.");
    $('#success_multiple').center().show();
  } else {
    $('#success').center().show();
  }

  $('#download').removeClass('disabled');
  $('#content>canvas').show();
}

function download() {
  [].forEach.call(document.querySelectorAll('#content>canvas'), function (element, index) {
    element.toBlob(function (blob) {
      if (window.saveAs) {
        window.saveAs(blob, "result " + (index + 1) + ".png");
      } else {
        navigator.saveBlob(blob, "result " + (index + 1) + ".png");
      }
    });
  });
}

function resizeEvent() {
  [].forEach.call($('.alert'), function (element) { $(element).center(); });
}

jQuery.fn.center = function () {
  this.css("position", "absolute");
  this.css("top", Math.max(0, (($(window).height() - this.outerHeight()) / 2)));
  this.css("left", Math.max(0, (($(window).width() - this.outerWidth()) / 2)));

  return this;
}