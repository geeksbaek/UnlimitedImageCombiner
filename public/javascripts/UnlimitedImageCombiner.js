window.onload = init;
window.onresize = resizeEvent;

function init() {
  // 폭 버튼을 누르면 이미지 합침
  [].forEach.call($('#radio>button'), function (element) {
    $(element).bind('click', function () {
      if (window.files != undefined && window.files.length > 1) {
        handleFiles();
      }
    });
  });

  // 수동 폭 입력 폼에서 엔터를 누르면 이미지 합침
  $('#width').keyup(function (e) {
    if (window.files != undefined && window.files.length > 1) {
      if (e.keyCode == 13 && $('#width').val() != '') {
        handleFiles();
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

  $('#clear').bind('click', allClear);
  $('#combine').bind('click', handleFiles);
  $('#download').bind('click', download);

  allClear();
}

function uploadEvent(input) {
  [].forEach.call(input, function (element) { window.files.push(element); });
  $('#clear').removeClass('disabled');
  $('#combine').removeClass('disabled');
}

function allClear() {
  $('canvas').remove();
  $('#buttons>button').addClass('disabled');
  window.files = [];
}

function resizeEvent() {
  [].forEach.call($('.alert'), function (element) { $(element).center(); });
}

function handleFiles() {
  if (window.files.length == 0) return;

  $('.alert').hide();
  $('canvas').remove();

  var images = [];
  var maxWidth = Number.MIN_VALUE, minWidth = Number.MAX_VALUE;
  var sumHeight = [{ height: 0, count: 0 }], sumHeightIndex = 0, realSumHeight = 0;
  var loader = new PxLoader;

  loader.addProgressListener(function (e) {
    maxWidth = Math.max(maxWidth, e.resource.img.width);
    minWidth = Math.min(minWidth, e.resource.img.width);
    images[e.resource.imageNumber] = { src: e.resource.img, height: e.resource.img.height };
  });

  loader.addCompletionListener(function (e) {
    var heights = [];
    var devideValue = $('#radio>.active').text() == '수동 폭' ?
      $('#width').val() : $('#radio>.active').text() == '자동 최대 폭' ?
      maxWidth : minWidth;
    var gap = 2;

    // 이미지들의 최종 높이 = realSumHeight
    // 캔버스의 개수 = sumHeightIndex
    // 각 캔버스의 높이와 캔버스에 들어갈 이미지의 개수 = sumHeight
    for (var i = 0, max = images.length; i < max; i++) {
      heights.push(images[i].src.height / (images[i].src.width / devideValue));

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

    var canvas = document.querySelectorAll('canvas');
    var ctx = [];

    [].forEach.call(canvas, function (element, index) {
      ctx[index] = element.getContext('2d');
    });

    for (var i = 0, totalCount = 0; i < canvas.length; i++) {
      canvas[i].width = devideValue;
      canvas[i].height = sumHeight[i].height - gap; // 여기

      ctx[i].save();
      ctx[i].fillStyle = 'white';
      ctx[i].fillRect(0, 0, canvas[i].width, canvas[i].height);
      ctx[i].restore();

      for (var j = 0, max = sumHeight[i].count, accrueHeight = 0; j < max; j++) {
        ctx[i].drawImage(images[totalCount].src, 0, accrueHeight, devideValue, heights[totalCount]);
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
    $('canvas').show();
  });

  for (var i = 0, max = window.files.length; i < max; i++) {
    var imgaeURL = URL.createObjectURL(window.files[i]);
    var pxImage = new PxLoaderImage(imgaeURL);
    pxImage.imageNumber = i;
    loader.add(pxImage);
  }

  loader.start();
}

function download() {
  [].forEach.call(document.querySelectorAll('canvas'), function (element, index) {
    element.toBlob(function (blob) {
      if (window.saveAs) {
        window.saveAs(blob, "result " + (index + 1) + ".png");
      } else {
        navigator.saveBlob(blob, "result " + (index + 1) + ".png");
      }
    });
  });
}

jQuery.fn.center = function () {
  this.css("position", "absolute");
  this.css("top", Math.max(0, (($(window).height() - this.outerHeight()) / 2)));
  this.css("left", Math.max(0, (($(window).width() - this.outerWidth()) / 2)));

  return this;
}