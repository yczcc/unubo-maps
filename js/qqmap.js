const MAX_PAGE = 500;

const LINE_WIDTH = 3;
const LINE_COLOR = '#000000';
const POINT_COLOR = '#00ff00';
const START_POINT_COLOR = '#0000ff';
const NOISE_POINT_COLOR = '#ff0000';
const POINT_RADIUS = 3;

var DATA = null;

function timestampToDatetimeStr(timestamp) {
    timestamp = new Date(parseInt(timestamp));
    const y = timestamp.getFullYear();
    const m = timestamp.getMonth() + 1;
    const d = timestamp.getDate();
    const h = timestamp.getHours();
    const mm = timestamp.getMinutes();
    const s = timestamp.getSeconds();
    return y.toString() + '-' + rjust(m.toString(), 2, '0') + '-' + rjust(d.toString(), 2, '0') + ' ' + rjust(h.toString(), 2, '0') + ':' + rjust(mm.toString(), 2, '0') + ':' + rjust(s.toString(), 2, '0');
}


function rjust(string, width, padding ) {
    padding = padding || " ";
    padding = padding.substr(0, 1);
    if( string.length < width )
        return padding.repeat(width - string.length) + string;
    else
        return string;
}


function getUrlParameter(sParam) {
    const sPageURL = decodeURIComponent(window.location.search.substring(1));
    const sURLVariables = sPageURL.split('&');
    var sParameterName;

    for (var i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? '' : sParameterName[1];
        }
    }
}


function fitPolygonBounds(map, polygon) {
    const location = polygon.getBounds();
    const sw = new qq.maps.LatLng(location.lat.maxY, location.lng.maxX); //西南角坐标
    const ne = new qq.maps.LatLng(location.lat.minY, location.lng.minX); //东北角坐标
    const latlngBounds = new qq.maps.LatLngBounds(ne, sw); //矩形的地理坐标范围
    map.fitBounds(latlngBounds);
}


function drawTrackLine(map, points, show) {
    const path = [];

    $.each(points, function (i, point) {
        path.push(new qq.maps.LatLng(point.lat, point.lng));
    });

    if (path.length === 0) {
        alert('没有需要绘制的点');
        return;
    }

    return new qq.maps.Polyline({
        map: map,
        path: path,
        strokeColor: LINE_COLOR,
        strokeDashStyle: 'solid',
        strokeWeight: show ? LINE_WIDTH : 0
    });
}


function createMarkTipFromPoint(point, title) {
    return title + ' - ' + point.id.toString() + '<br>'
        + '位置：'  + point.lng + ', ' + point.lat + '<br>'
        + '时间：' + timestampToDatetimeStr(point.timestamp * 1000) + '<br>'
        + '上一点到此点距离：' + point.distance + '<br>'
        + '上一点到此点速度：' + point.speed + '<br>'
}


function drawTrackPointsFaster(map, points, title) {
    $.each(points, function (i) {
        const point = points[i];
        point.id = i;
        if (point.id === 0) {
            point.type = 'start'
        }
        if (point.noise) {
            point.type = 'noise'
        }
    });

    if (points.length === 0) {
        return;
    }

    new qq.maps.plugin.Dots({
        map: map,
        data: points,
        debug: 0,
        groupBy: 'type',
        groupStyles: {
          'noise':  {
              fillColor: NOISE_POINT_COLOR,
              strokeColor: 'rgba(255, 255, 255, 0.05)',
              strokeWidth: 0,
              radius: POINT_RADIUS * 2
          },
          'start':  {
              fillColor: START_POINT_COLOR,
              strokeColor: 'rgba(255, 255, 255, 0.05)',
              strokeWidth: 0,
              radius: POINT_RADIUS * 2
          }
        },
        style: {
            fillColor: POINT_COLOR,
            strokeColor: 'rgba(255, 255, 255, 0.05)',
            strokeWidth: 0,
            radius: POINT_RADIUS
        },
        onClick: function (point) {
            if (point === null) {
                return;
            }
            var infoWin = new qq.maps.InfoWindow({
                map: map
            });
            infoWin.setContent(createMarkTipFromPoint(points[point.id], title));
            infoWin.setPosition(new qq.maps.LatLng(point.lat, point.lng));
            infoWin.open();
        }
    });
}


 function realDrawTrack(map, draw_track, draw_dot, title) {
     return function (res) {
         if (DATA === null) {
             DATA = res;
         }
         var points = res.points;
         $('#from').text(res.from);
         if (points) {
             const polygon = drawTrackLine(map, points, draw_track);
             if (draw_dot) {
                 drawTrackPointsFaster(map, points, title);
             }
             fitPolygonBounds(map, polygon);
         }
         return res
     }
 }


function requestAndDrawTrack(filename, map, draw_track, draw_dot, title) {
    if (DATA === null) {
        $.ajax({
            url: 'tracks/' + filename + '.json',
            type: 'GET',
            dataType: 'json',
            async: false,
            success: realDrawTrack(map, draw_track, draw_dot, title),
            error: function (xhr, statusText, error) {
             alert(error);
            }
        });
    } else {
        realDrawTrack(map, draw_track, draw_dot, title)(DATA);
    }
 }


 function getOptionFromReq() {
    return {
        page: (parseInt(getUrlParameter('page'), 10) || 1),
        track: getUrlParameter('track') !== '0',
        point: getUrlParameter('point') !== '0'
    }
 }

 function optionToDom(option) {
    Object.keys(option).forEach(function (key) {
        const value = option[key];
        const element = $('#' + key);
        if (typeof value === 'boolean') {
            element.prop('checked', value)
        } else {
            element.text(value)
        }
    });
 }

 function getOptionFromDom() {
    return {
        page: (parseInt($('#page').text(), 10) || 1),
        track: $('#track').prop('checked'),
        point: $('#point').prop('checked')
    }
 }

 function realOptionToQuery(option) {
    const res = [];
    Object.keys(option).forEach(function (key) {
        var value = option[key];
        if (typeof value === 'boolean') {
            value = value ? '1' : '0';
        }
        res.push(key.toString() + '=' + encodeURIComponent(value.toString().replace(' ', '+')))
    });
    return res.join('&')
 }


 function optionToQuery(option, type) {
    const tempOption = Object.assign({}, option);
    if (type === 'next') {
        tempOption.page++;
    } else if (type === 'prev') {
        tempOption.page--;
    }
    return realOptionToQuery(tempOption);
 }


 function createMap() {
    return new qq.maps.Map(document.getElementById("QQMap"), {
        center: new qq.maps.LatLng(39.916527, 116.397128),
        zoom: 13
    });
 }

 function updateMap() {
    const option = getOptionFromDom();
    requestAndDrawTrack(rjust(option.page.toString(), 3, '0'), createMap(), option.track, option.point, option.page);
 }

function init_QQMap() {
    var path=[
        new qq.maps.LatLng(39.930456,116.387554),
        new qq.maps.LatLng(39.929008,116.414162),
        new qq.maps.LatLng(39.909786,116.379314),
        new qq.maps.LatLng(39.908206,116.416908)
    ];
    var polyline = new qq.maps.Polyline({
        path: path,
        strokeColor: '#000000',
        strokeWeight: 5,
        editable:false,
        map: map
    });

    var QQMap_showPoint = document.getElementById("QQMap_showPoint");
    var QQMap_showPoint_flag=false;
    qq.maps.event.addDomListener(QQMap_showPoint,"click",function(){
        polyline.setMap(map);
        if(QQMap_showPoint_flag){
            QQMap_showPoint_flag = false;
            polyline.setVisible(QQMap_showPoint_flag);
        }else{
            QQMap_showPoint_flag = true;
            polyline.setVisible(QQMap_showPoint_flag);
        }
    });

    var visibleF=true;
    var visibleT=document.getElementById("QQMap_visible");
    qq.maps.event.addDomListener(visibleT,"click",function(){
        polyline.setMap(map);
        if(visibleF){
            visibleF=false;
            polyline.setVisible(false);
        }else{
            visibleF=true;
            polyline.setVisible(true);
        }
    });
};