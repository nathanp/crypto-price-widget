function writeName () {
 
  document.getElementById('firstname').innerHTML = 'Your name is ';
}
app.on('ready', writeName);