// Création d'une APP qui stocke toutes les méthodes
APP = {};

// Initialiser le script de la page
APP.main = function(){
APP.creatMap();

};



APP.creatMap = function(){

  // Définition de la carte et du cadre en SVG
let svg = d3.select("svg.choropleth");
let width = svg.attr("width");
let height = svg.attr("height");

// Définition d'une géométrie geoJSON en SVG
let path = d3.geoPath();

// Chargement des données dans une file
d3.queue()
  .defer(d3.json, "https://cdn.rawgit.com/christiankaiser/d3-topojson-choropleth/ee12f6a108eddaa9cd119866b2e9cd52bb450cbc/data/vec200-topo.json")
  .defer(d3.tsv, "https://cdn.rawgit.com/christiankaiser/d3-topojson-choropleth/ee12f6a108eddaa9cd119866b2e9cd52bb450cbc/data/pop-fem-2034-2015.tsv")

  .await(APP.drawMap);
}

APP.drawMap = function(error,data, data1){
  if (error) throw error;




}
