// Création d'une APP qui stocke toutes les méthodes
APP = {};

// Variable globale M (définition des variables et du cadre de l'écran)
var M = {
  bbox: [485000, 70000, 834000, 296000],
  data: {},
  dataSeries: [],
  dataArray: []
};

// Initialiser le script de la page
APP.main = function(){
APP.creatMap();
//APP.handleMouseOver();
// APP.handleMouseOut();

};

// Définition de la carte en SVG avec le cadre notamment
APP.creatMap = function(){
  M.svg = d3.select("svg.choropleth");
  M.width = M.svg.attr('width');
  M.height = M.svg.attr('height');

// Définition d'une géométrie géoJSON en SVG
  M.path = d3.geoPath();

  // Il faut créer une sorte de boucle (queue) qui permet de charger les données ainsi que les shapefiles
  d3.queue()
    .defer(
      d3.json,
      //"https://cdn.rawgit.com/christiankaiser/d3-topojson-choropleth/ee12f6a108eddaa9cd119866b2e9cd52bb450cbc/data/vec200-topo.json"
      "https://rawgit.com/ludivinestofer/topo/c07a42bb4d66ae62322507b5f8a5bad4b29f08d5/TopoJson/cantons_lakes_topo.json"
    )
    .defer(
      d3.tsv,
      "https://cdn.rawgit.com/ludivinestofer/topo/bc16af4bf1b8e792be14b05326bb6128d432aa04/Data/evo_pop_essai.tsv",
      function(d){
        M.data[d.kt] = d;
        M.dataArray.push(d);
        // Construire un array avec les valeurs pour ClassyBrew (mise en classe)
        // donc uniquement variable relative
        M.dataSeries.push(parseFloat(d.variation_pourcent))
      }
    )
    .await(APP.drawMap);

}


APP.drawMap = function(error, data){
  if (error) throw error;

  // The TopoJSON contains raw coordinates in CRS CH1903/LV03.
  // As this is already a projected CRS, we can use an SVG transform
  // to fit the map into the SVG view frame.
  // In a first step, we compute the transform parameters.

  // Compute the scale of the transform
  var scaleX = M.width / (M.bbox[2] - M.bbox[0]),
      scaleY = M.height / (M.bbox[3] - M.bbox[1]);
  var scale = Math.min(scaleX, scaleY); // Pour garder la même échelle en x et en y afin d'éviter les déformations

  var dx = -1 * scale * M.bbox[0];
  var dy = scale * M.bbox[1] + parseFloat(M.height);

  M.map = M.svg.append('g')
    .attr('class', 'map')
    .attr(
      'transform',
      'matrix('+scale+' 0 0 -'+scale+' '+dx+' '+dy+')'
    );

  // Mise en classe de la carte avec Jenks.
  M.brew = new classyBrew();
  M.brew.setSeries(M.dataSeries);
  M.brew.setNumClasses(4);
  M.brew.setColorCode('Oranges');
  M.breaks = M.brew.classify('jenks');

// Sélection des classes et des couleurs
  M.color = d3.scaleThreshold()
    .domain(M.breaks.slice(1,6))
    .range(M.brew.getColors());

  M.cantons = topojson.feature(data, data.objects.cantons).features;
  M.cantonsIdx = {};
  for (var i=0; i < M.cantons.length; i++){
    M.cantonsIdx[M.cantons[i].properties.KTNR.toString()] = M.cantons[i];
  }


  // Création de la couche des cantons
  M.map
    .append('g').attr('class', 'cantons')
    .selectAll('path')
    .data(M.cantons) // Utilisation et conversion du TopoJSON
    .enter()
    .append('path')
    .attr('fill', function(d){
        return '#ccc';
      // return M.data[d.properties.id] ?
      return M.color(M.data[d.properties.kt].variation_pourcent)
      //  '#fff'; // Code couleur pour les données manquantes.
    })
    .on('mouseover', APP.handleMouseOver)
    .on('mouseout', APP.handleMouseOut)
    .on('mousemove', APP.TooltopMouse)
    .attr('id', d => d.properties.KTNR)
    .attr('stroke', '#fff').attr('stroke-width', '200')
    .attr('d', M.path);

// Création de la couche des lacs
    M.map
      .append('g').attr('class', 'lacs')
      .selectAll('path')
      .data(topojson.feature(data, data.objects.lacs).features)
      .enter().append('path')
      .attr('fill', '#EAEAEA').attr('d', M.path);

// Création des symboles proportionnels
    M.map
      .append('g').attr('class', 'symbol')
      .selectAll('path')
      .data(M.dataArray.sort(function(a, b) { return b.variation_absolue - a.variation_absolue; }))
      .enter()
      .append('circle')
      .attr('cx', function(d){ return M.cantonsIdx[d.kt].properties.X_CNTR; })
      .attr('cy', function(d){ return M.cantonsIdx[d.kt].properties.Y_CNTR; })
      .attr('r', function(d) { return 100 * Math.pow(d.variation_absolue, 0.57); })
      .attr('fill', function(d){
        return M.color(d.variation_pourcent)
      })
      .attr('id', d => `${d.kt}`)
      .attr('stroke', '#fff').attr('stroke-width', '200');

  }

  // Création du tooltip avec opacité lors du survol avec la souris
  let toolTip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

  //     if (M.data[d.kt] = d){
  //     toolTip.html(`Population : ${i} <br> Variation (%) : ${d.variation_pourcent}`)
  //       .style("left", `${d3.event.pageX-200}px`)
  //       .style("top", `${d3.event.pageY+0}px`)
  //       .style ("color", "#6473aa");
  //   } else {
  //     toolTip.html(`Population : ${i} <br> Variation (%) : 'No data'`)
  //       .style("left", `${d3.event.pageX+80}px`) // Eloignement de gauche à droite
  //       .style("top", `${d3.event.pageY+0}px`) // Eloignement de haut en bas
  //       .style ("color", "#890883");
  //  }



//Fonction qui met la barre plus transparente et qui affiche le tooltip lors du passage de la souris
APP.handleMouseOver = function (d, i){
  //console.log(d);
  let onKT = this.id;
  //console.log(onKT);
  d3.select(this)
  .style("opacity", 0.6)
  .attr('fill', 'grey')

  d3.selectAll('circle')
    .filter(f => f.kt == onKT)
    .attr('stroke-width', '500') ;

  //console.log(test)
  // toolTip.transition()
  //   .duration(100)
  //   .style("opacity", 0.9);
  };


  APP.TooltopMouse = function (d){
    let onKT = this.id;

    toolTip.html(`Age : ${M.dataArray.filter(i => i.kt == onKT)[0].variation_absolue} <br> Population : ${M.dataArray.filter(i => i.kt == onKT)[0].variation_pourcent}`)
            .style("left", `${d3.event.pageX-200}px`)
            .style("top", `${d3.event.pageY+0}px`)
            .style ("color", "#6473aa")
            .style('opacity', 1);

  }

// Fonction qui remet l'opacité et le tooltip à zéro une fois que la souris est passé
APP.handleMouseOut = function (d){
  d3.select(this)
    .style("opacity", 1)
    .attr('fill', '#ccc')

  d3.selectAll('circle')
    .attr('stroke-width', '200');
  // toolTip.transition()
  //        .duration(500)
  //        .style("opacity", 0);
}


  // Limites des cantons tracées en blanc. Attention le stroke-width est en mètres !!
  // M.map
  //   .append('g').attr('class', 'cantons')
  //   .selectAll('path')
  //   .data(topojson.feature(data, data.objects.cantons).features)
  //   .enter()
  //   .append('path')
  //   .attr('stroke', '#fff').attr('stroke-width', '200')
  //   .attr('fill', 'none').attr('d', M.path);

  // La couche des lacs est en dernier afin qu'ils apparaissent dessus.
