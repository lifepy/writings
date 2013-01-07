var ArticleIndex = function() {
  var _this = this;

  this.fetching = false;
  this.$articles = $('#articles');
  this.$bulkbar = $('#bulkbar');
  this.$newBookForm = $('#new-book-form');

  this.connect(window, 'scroll.ArticleIndex', this.onScroll);
  this.$articles.on('click', '.article .title a', function(event) {
    _this.editArticle(event, this);
  });
  this.$articles.on('click', '.article', function(event) {
    _this.bulkSelect(event, this);
  });

  this.connect(this.$newBookForm, 'submit', this.createBook);
  this.connect(this.$bulkbar.find('.cancel-button'), 'click', this.bulkCancel);
  this.connect(this.$bulkbar.find('.edit-button'), 'click', this.bulkEdit);

  this.$moveBookForm = $('#move-book-form');
  this.connect(this.$moveBookForm, 'submit', this.bulkMove);
  this.$moveBookForm.find('.dropdown').on('click', '.dropdown-menu li a', function(event) {
    _this.selectMoveBook(event, this);
  });
};

ArticleIndex.prototype = {
  destroy: function() {
    $(window).off('.ArticleIndex');
  },

  connect: function(element, event, fn) {
    var _this = this;
    $(element).on(event, function(event) {
      fn.call(_this, event, this);
    });
  },

  selectedArticleIds: function() {
    return this.$articles.find('.selected').map(function() {
      return $(this).data('id');
    });
  },

  onScroll: function() {
    var isButtom = $(window).scrollTop() + 200 >= $(document).height() - $(window).height();
    var _this = this;

    if (isButtom && !_this.fetching && !_this.$articles.data('is-end')) {
      _this.fetching = true;

      $.ajax({
        url: _this.$articles.data('url'),
        data: { skip: _this.$articles.data('skip') },
        dataType: 'script',
        complete: function() {
          _this.fetching = false;
        }
      });
    }
  },

  editArticle: function(event, element) {
    event.preventDefault();
    event.stopPropagation();
    window.open($(element).attr('href'), '_blank');
  },

  createBook: function(event) {
    event.preventDefault();

    $.ajax({
      url: '/books',
      data: this.$newBookForm.serializeArray(),
      type: 'post',
      dataType: 'json'
    }).success(function(data) {
      Turbolinks.visit('/books/' + data.urlname);
    });
  },

  selectMoveBook: function(event, element) {
    event.preventDefault();
    var $item = $(element);
    $item.closest('.dropdown').find('.dropdown-toggle').text($item.text());
    this.$moveBookForm.find('[name*=book_id]').val($item.data('book-id'));
  },

  updateBulkbar: function() {
    var count = $('#articles .article.selected').length;
    this.$bulkbar.find('.selected-count').text(count);
    if (count) {
      this.$bulkbar.show();
    } else {
      this.$bulkbar.hide();
    }

    if (count > 1) {
      this.$bulkbar.find('.edit-button').addClass('disabled');
    } else {
      this.$bulkbar.find('.edit-button').removeClass('disabled');
    }
  },

  bulkSelect: function(event, element) {
    event.preventDefault();

    $(element).toggleClass('selected');
    this.updateBulkbar();
  },

  bulkCancel: function(event) {
    event.preventDefault();
    this.$articles.find('.article.selected').removeClass('selected');
    this.$bulkbar.hide().find('.selected-count').text(0);
  },

  bulkEdit: function(event) {
    event.preventDefault();

    if (this.$articles.find('.article.selected').length === 1) {
      window.open(this.$articles.find('.article.selected .title a').attr('href'), '_blank');
    }
  },

  bulkMove: function(event) {
    event.preventDefault();
    var _this = this;

    $.ajax({
      url: '/articles/bulk',
      data: {
        type: 'move',
        ids: this.selectedArticleIds().get(),
        book_id: this.$moveBookForm.find('[name*=book_id]').val()
      },
      dataType: 'json',
      type: 'post'
    }).success(function(data) {
      var moveOut = !$('#articles-index').length; // except all article page
      $.each(data, function() {
        var $article = _this.$articles.find('.article[data-id=' + this.id + ']');
        if (moveOut) {
          $article.remove();
        } else {
          if (this.book_name) {
            $article.find('.book').html($('<span class="book_name">').text(this.book_name));
          } else {
            $article.find('.book').html('');
          }
        }
      });

      if (moveOut) {
        var skip = _this.$articles.data('skip');
        _this.$articles.data('skip', skip - data.length);
        console.log(_this.$articles.data('skip'));
      }

      Dialog.hide('#move-book-modal');
      _this.updateBulkbar();
    });
  }
};

var count = 0;

page_ready(function() {
  if ($('#articles-index, #articles-book, #articles-not_collected').length) {
    window.articleIndex = new ArticleIndex();

    $(document).one('page:change', function() {
      window.articleIndex.destroy();
      delete window.articleIndex;
    });
  }
});