import * as d3 from 'd3';
import * as d3Cloud from 'd3-cloud';
import React, {useEffect} from 'react';

// https://towardsdatascience.com/react-d3-the-macaroni-and-cheese-of-the-data-visualization-world-12bafde1f922

const Cloud = (props) => {
  useEffect(() => {
    console.log('use Effect');
    worldCloud(props);
  }, [props.words.length]);
  return <div className="cloud"/>;
};

const worldCloud = (props) => {
  const words = props.words;

  const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * 0.8;
  const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * 0.8;

  const fillScale = d3.scaleOrdinal(d3.schemeCategory10);
  const minValue = 0;
  const wordSizes = words.filter(w => w.value > minValue).map(w => w.value);
  const sizeScale = d3.scaleLinear().
      range([10, 100]).
      domain([Math.min(...wordSizes), Math.max(...wordSizes)]);
  console.log([Math.min(...wordSizes), Math.max(...wordSizes)]);

  var layout = d3Cloud().
      size([w, h]).
      words(words.filter(w => w.value > minValue).map(function(w) {
        return {text: w.text, size: sizeScale(w.value)};
      })).
      padding(5).
      rotate(function() {
        return 0;
      }).
      font('Verdana').
      fontWeight('bold').
      fontSize(function(d) {
        return d.size;
      }).
      on('end', draw);

  layout.start();

  function draw(words) {
    console.log("draw",words);
    d3.select('.cloud > *').remove();
    const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    d3.select('.cloud').
        append('svg').
        attr('width', layout.size()[0]).
        attr('height', layout.size()[1]).
        append('g').
        attr('transform', 'translate(' + layout.size()[0] / 2 + ',' +
            layout.size()[1] / 2 + ')').
        selectAll('text').
        data(words).
        enter().
        append('text').
        style('font-size', function(d) {
          return d.size + 'px';
        }).
        style('font-family', 'Verdana').
        style('font-weight', 'bold').
        attr('text-anchor', 'middle').
        attr('transform', function(d) {
          return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
        }).
        style('fill', t => {
          return fillScale(t.text);
        }).
        text(function(d) {
          return d.text;
        });
  }
}

export default Cloud;
