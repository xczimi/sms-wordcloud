import * as d3 from 'd3';

function flatten(t, e) {
  if ('string' == typeof t)
    return t;
  var n = [];
  for (e in t) {
    var a = flatten(t[e], e);
    a && n.push(a);
  }
  return n.join(' ');
}

function parseText(t) {
  tags = {};
  var e = {}
      , n = d3.select('#per-line').property('checked');
  t.split(n ? /\n/g : wordSeparators).forEach(function(t) {
    discard.test(t) || (n || (t = t.replace(punctuation, '')),
    stopWords.test(t.toLowerCase()) || (t = t.substr(0, maxLength),
        e[t.toLowerCase()] = t,
        tags[t = t.toLowerCase()] = (tags[t] || 0) + 1));
  }),
      tags = d3.entries(tags).sort(function(t, e) {
        return e.value - t.value;
      }),
      tags.forEach(function(t) {
        t.key = e[t.key];
      }),
      generate();
}

function generate() {
  layout.font(d3.select('#font').property('value')).
      spiral(d3.select('input[name=spiral]:checked').property('value')),
      fontSize = d3.scale[d3.select('input[name=scale]:checked').
          property('value')]().range([10, 100]),
  tags.length &&
  fontSize.domain([+tags[tags.length - 1].value || 1, +tags[0].value]),
      complete = 0,
      statusText.style('display', null),
      words = [],
      layout.stop().
          words(tags.slice(0, max = Math.min(tags.length,
              +d3.select('#max').property('value')))).
          start();
}

function progress(t) {
  statusText.text(++complete + '/' + max);
}

function draw(t, e) {
  statusText.style('display', 'none'),
      scale = e ?
          Math.min(w / Math.abs(e[1].x - w / 2), w / Math.abs(e[0].x - w / 2),
              h / Math.abs(e[1].y - h / 2), h / Math.abs(e[0].y - h / 2)) / 2 :
          1,
      words = t;
  var n = vis.selectAll('text').data(words, function(t) {
    return t.text.toLowerCase();
  });
  n.transition().duration(1e3).attr('transform', function(t) {
    return 'translate(' + [t.x, t.y] + ')rotate(' + t.rotate + ')';
  }).style('font-size', function(t) {
    return t.size + 'px';
  }),
      n.enter().
          append('text').
          attr('text-anchor', 'middle').
          attr('transform', function(t) {
            return 'translate(' + [t.x, t.y] + ')rotate(' + t.rotate + ')';
          }).
          style('font-size', '1px').
          transition().
          duration(1e3).
          style('font-size', function(t) {
            return t.size + 'px';
          }),
      n.style('font-family', function(t) {
        return t.font;
      }).style('fill', function(t) {
        return fill(t.text.toLowerCase());
      }).text(function(t) {
        return t.text;
      });
  var a = background.append('g').attr('transform', vis.attr('transform'))
      , r = a.node();
  n.exit().each(function() {
    r.appendChild(this);
  }),
      a.transition().duration(1e3).style('opacity', 1e-6).remove(),
      vis.transition().
          delay(1e3).
          duration(750).
          attr('transform',
              'translate(' + [w >> 1, h >> 1] + ')scale(' + scale + ')');
}

function downloadPNG() {
  d3.event.preventDefault();
  var t = document.createElement('canvas')
      , e = t.getContext('2d');
  t.width = w,
      t.height = h,
      e.translate(w >> 1, h >> 1),
      e.scale(scale, scale),
      words.forEach(function(t, n) {
        e.save(),
            e.translate(t.x, t.y),
            e.rotate(t.rotate * Math.PI / 180),
            e.textAlign = 'center',
            e.fillStyle = fill(t.text.toLowerCase()),
            e.font = t.size + 'px ' + t.font,
            e.fillText(t.text, 0, 0),
            e.restore();
      }),
      echoContentType.attr('value', 'image/png'),
      echoInput.attr('value', t.toDataURL('image/png')),
      echoForm.node().submit();
}

function downloadSVG() {
  d3.event.preventDefault(),
      echoContentType.attr('value', 'image/svg+xml;charset=utf-8'),
      echoInput.attr('value', svg.attr('version', '1.1').
          attr('xmlns', 'http://www.w3.org/2000/svg').
          node().parentNode.innerHTML),
      echoForm.node().submit();
}

var unicodePunctuationRe = '!-#%-*,-/:;?@\\[-\\]_{}\xa1\xa7\xab\xb6\xb7\xbb\xbf\u037e\u0387\u055a-\u055f\u0589\u058a\u05be\u05c0\u05c3\u05c6\u05f3\u05f4\u0609\u060a\u060c\u060d\u061b\u061e\u061f\u066a-\u066d\u06d4\u0700-\u070d\u07f7-\u07f9\u0830-\u083e\u085e\u0964\u0965\u0970\u0af0\u0df4\u0e4f\u0e5a\u0e5b\u0f04-\u0f12\u0f14\u0f3a-\u0f3d\u0f85\u0fd0-\u0fd4\u0fd9\u0fda\u104a-\u104f\u10fb\u1360-\u1368\u1400\u166d\u166e\u169b\u169c\u16eb-\u16ed\u1735\u1736\u17d4-\u17d6\u17d8-\u17da\u1800-\u180a\u1944\u1945\u1a1e\u1a1f\u1aa0-\u1aa6\u1aa8-\u1aad\u1b5a-\u1b60\u1bfc-\u1bff\u1c3b-\u1c3f\u1c7e\u1c7f\u1cc0-\u1cc7\u1cd3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205e\u207d\u207e\u208d\u208e\u2329\u232a\u2768-\u2775\u27c5\u27c6\u27e6-\u27ef\u2983-\u2998\u29d8-\u29db\u29fc\u29fd\u2cf9-\u2cfc\u2cfe\u2cff\u2d70\u2e00-\u2e2e\u2e30-\u2e3b\u3001-\u3003\u3008-\u3011\u3014-\u301f\u3030\u303d\u30a0\u30fb\ua4fe\ua4ff\ua60d-\ua60f\ua673\ua67e\ua6f2-\ua6f7\ua874-\ua877\ua8ce\ua8cf\ua8f8-\ua8fa\ua92e\ua92f\ua95f\ua9c1-\ua9cd\ua9de\ua9df\uaa5c-\uaa5f\uaade\uaadf\uaaf0\uaaf1\uabeb\ufd3e\ufd3f\ufe10-\ufe19\ufe30-\ufe52\ufe54-\ufe61\ufe63\ufe68\ufe6a\ufe6b\uff01-\uff03\uff05-\uff0a\uff0c-\uff0f\uff1a\uff1b\uff1f\uff20\uff3b-\uff3d\uff3f\uff5b\uff5d\uff5f-\uff65',
    fill = d3.scale.category20b(), w = 960, h = 600, words = [], max, scale = 1,
    complete = 0, keyword = '', tags, fontSize, maxLength = 30, fetcher,
    statusText = d3.select('#status'),
    layout = d3.layout.cloud().
        timeInterval(10).
        size([w, h]).
        fontSize(function(t) {
          return fontSize(+t.value);
        }).
        text(function(t) {
          return t.key;
        }).
        on('word', progress).
        on('end', draw), echoForm = d3.select('body').
        append('form').
        attr('action', 'https://www.jasondavies.com/echo').
        attr('target', '_blank').
        attr('method', 'POST'), echoContentType = echoForm.append('input').
        attr('type', 'hidden').
        attr('name', 'content-type'), echoInput = echoForm.append('input').
        attr('type', 'hidden').
        attr('name', 'echo'),
    svg = d3.select('#vis').append('svg').attr('width', w).attr('height', h),
    background = svg.append('g'),
    vis = svg.append('g').
        attr('transform', 'translate(' + [w >> 1, h >> 1] + ')');
d3.select('#download-svg').on('click', downloadSVG),
    d3.select('#download-png').on('click', downloadPNG);
var form = d3.select('#form').on('submit', function() {
  parseText(d3.select('#text').property('value')),
      d3.event.preventDefault();
});
form.selectAll('input[type=number]').on('click.refresh', function() {
  this.value !== this.defaultValue && (generate(),
      this.defaultValue = this.value);
}),
    form.selectAll('input[type=radio], #font').on('change', generate);
var stopWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/
    , punctuation = new RegExp('[' + unicodePunctuationRe + ']', 'g')
    ,
    wordSeparators = /[ \f\n\r\t\v\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g
    , discard = /^(@|https?:|\/\/)/
    ,
    htmlTags = /(<[^>]*?>|<script.*?<\/script>|<style.*?<\/style>|<head.*?><\/head>)/g
    , matchTwitter = /^https?:\/\/([^\.]*\.)?twitter\.com/;
d3.select('#random-palette').on('click', function() {
  paletteJSON('http://www.colourlovers.com/api/palettes/random', {},
      function(t) {
        fill.range(t[0].colors),
            vis.selectAll('text').style('fill', function(t) {
              return fill(t.text.toLowerCase());
            });
      }),
      d3.event.preventDefault();
}),
    function() {
      function t() {
        c = +d3.select('#angle-count').property('value'),
            u = Math.max(-90,
                Math.min(90, +d3.select('#angle-from').property('value'))),
            i = Math.max(-90,
                Math.min(90, +d3.select('#angle-to').property('value'))),
            e();
      }

      function e() {
        h.domain([0, c - 1]).range([u, i]);
        var t = l.selectAll('path.angle').data([
          {
            startAngle: u * d,
            endAngle: i * d,
          }]);
        t.enter().
            insert('path', 'circle').
            attr('class', 'angle').
            style('fill', '#fc0'),
            t.attr('d', f);
        var o = l.selectAll('line.angle').data(d3.range(c).map(h));
        o.enter().append('line').attr('class', 'angle'),
            o.exit().remove(),
            o.attr('transform', function(t) {
              return 'rotate(' + (90 + t) + ')';
            }).attr('x2', function(t, e) {
              return e && e !== c - 1 ? -r : -r - 5;
            });
        var s = l.selectAll('path.drag').data([u, i]);
        s.enter().
            append('path').
            attr('class', 'drag').
            attr('d', 'M-9.5,0L-3,3.5L-3,-3.5Z').
            call(d3.behavior.drag().on('drag', function(t, o) {
              t = (o ? i : u) + 90;
              var s = [-r * Math.cos(t * d), -r * Math.sin(t * d)]
                  , l = [d3.event.x, d3.event.y]
                  , c = ~~(Math.atan2(n(s, l), a(s, l)) / d);
              t = Math.max(-90, Math.min(90, t + c - 90)),
                  c = i - u,
                  o ? (i = t,
                      c > 360 ? u += c - 360 : 0 > c && (u = i)) : (u = t,
                      c > 360 ? i += 360 - c : 0 > c && (i = u)),
                  e();
            }).on('dragend', generate)),
            s.attr('transform', function(t) {
              return 'rotate(' + (t + 90) + ')translate(-' + r + ')';
            }),
            layout.rotate(function() {
              return h(~~(Math.random() * c));
            }),
            d3.select('#angle-count').property('value', c),
            d3.select('#angle-from').property('value', u),
            d3.select('#angle-to').property('value', i);
      }

      function n(t, e) {
        return t[0] * e[1] - t[1] * e[0];
      }

      function a(t, e) {
        return t[0] * e[0] + t[1] * e[1];
      }

      var r = 40.5
          , o = 35
          , s = 20
          , l = d3.select('#angles').
          append('svg').
          attr('width', 2 * (r + o)).
          attr('height', r + 1.5 * s).
          append('g').
          attr('transform', 'translate(' + [r + o, r + s] + ')');
      l.append('path').
          style('fill', 'none').
          attr('d', ['M', -r, 0, 'A', r, r, 0, 0, 1, r, 0].join(' ')),
          l.append('line').attr('x1', -r - 7).attr('x2', r + 7),
          l.append('line').attr('y2', -r - 7),
          l.selectAll('text').
              data([-90, 0, 90]).
              enter().
              append('text').
              attr('dy', function(t, e) {
                return 1 === e ? null : '.3em';
              }).
              attr('text-anchor', function(t, e) {
                return ['end', 'middle', 'start'][e];
              }).
              attr('transform', function(t) {
                return t += 90,
                'rotate(' + t + ')translate(' + -(r + 10) + ')rotate(' + -t +
                ')translate(2)';
              }).
              text(function(t) {
                return t + '\xb0';
              });
      var u, i, c, d = Math.PI / 180, h = d3.scale.linear(),
          f = d3.svg.arc().innerRadius(0).outerRadius(r);
      d3.selectAll('#angle-count, #angle-from, #angle-to').
          on('change', t).
          on('mouseup', t),
          t(),
          parseText(d3.select('#text').property('value'));
    }();
