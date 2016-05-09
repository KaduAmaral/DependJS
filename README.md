# DependJS


Carregue todas as suas dependencias Javascript com o DependJS.

### Exemplo:


    Dependencies = new DependJS([
      { // Css
         styles: [
            {href:'demo.css'},
            {href:'demo2.css'}
         ]
      },
      {src: 'https://code.jquery.com/jquery-2.2.3.min.js'},
      {src: 'http://momentjs.com/downloads/moment.js'},
      {src: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js'}
    ]).done(function(){
      // Todos os scripts carregados com sucesso
    }).error(function(){
      // Tudo executado, mas houve uma ou mais falhas...
    });