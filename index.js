module.exports = function(query, callback, params) {
  return new Promise(resolve => {
    if (typeof params === 'boolean') {
      params = {
        init: params,
      };
    }

    const arriving = element => {
      resolve(element);
      callback && callback(element);
    };

    const start = () => {
      setTimeout(() => {
        document.addEventListener('DOMNodeInserted', event => {
          setTimeout(() => {
            if (event.target) {
              if (event.target.matches && event.target.matches(selector)) {
                arriving(event.target);
              }

              if (event.target.querySelectorAll) {
                event.target.querySelectorAll(selector).forEach(element => {
                  arriving(element);
                });
              }
            }
          });
        });

        if (existing) {
          document.querySelectorAll(selector).forEach(element => {
            arriving(element);
          });
        }
      });
    };

    if (['interactive', 'complete'].includes(document.readyState)) {
      start();
    } else {
      document.addEventListener('DOMContentLoaded', start);
    }
  });
};
