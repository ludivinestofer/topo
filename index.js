// Création d'une APP qui stocke toutes les méthodes
APP = {};

// Variable globale M (définition des variables et du cadre de l'écran)
var M = {
  bbox: [485000, 70000, 834000, 296000],
  data: {}, dataSeries: [],
};

// Initialiser le script de la page
APP.main = function(){
APP.creatMap();

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
      "https://cdn.rawgit.com/christiankaiser/d3-topojson-choropleth/ee12f6a108eddaa9cd119866b2e9cd52bb450cbc/data/vec200-topo.json"
    )
    .defer(
      d3.json,
      "https://cdn.rawgit.com/ludivinestofer/topo/master/Data/data.json",
      function(d){
        M.data[d.canton] = d;
        // M.dataSeries.push(parseFloat(d.p_fem_singl_2034))
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
  // M.brew = new classyBrew();
  // M.brew.setSeries(M.dataSeries);
  // M.brew.setNumClasses(6);
  // M.brew.setColorCode('PuBu');
  // M.breaks = M.brew.classify('jenks');

// Sélection des classes et des couleurs
  // M.color = d3.scaleThreshold()
  //   .domain(M.breaks.slice(1,6))
  //   .range(M.brew.getColors());

  // Transformation des features en geoJSON et en SVG
  M.map
    .append('g').attr('class', 'communes')
    .selectAll('path')
    .data(topojson.feature(data, data.objects.communes).features) // Utilisation et conversion du TopoJSON
    .enter()
    .append('path')
    .attr('fill', function(d){
      return '#f00';
      // return M.data[d.properties.id] ?
      //   M.color(M.data[d.properties.id].p_fem_singl_2034) :
        '#fff'; // Code couleur pour les données manquantes.
    })
    .attr('stroke', '#fff').attr('stroke-width', '200')
    .attr('d', M.path);

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
  M.map
    .append('g').attr('class', 'lacs')
    .selectAll('path')
    .data(topojson.feature(data, data.objects.lacs).features)
    .enter().append('path')
    .attr('fill', '#777').attr('d', M.path);
}
