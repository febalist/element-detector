module.exports = function(selector, callback, params) {
  return new Promise(resolve => {
    if (typeof params === 'boolean') {
      params = {
        existing: params,
      };
    }

    params ??= {};

    params.existing ??= true;
    params.root ??= window.document;

    let arrived = false;

    const arriving = element => {
      if (!arrived) {
        arrived = true;
      } else if (params.once) {
        return;
      }

      resolve(element);
      callback && callback(element);
    };

    const start = () => {
      setTimeout(() => {
        params.root.addEventListener('DOMNodeInserted', event => {
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

        if (params.existing) {
          params.root.querySelectorAll(selector).forEach(element => {
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
