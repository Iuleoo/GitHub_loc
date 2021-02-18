// ==UserScript==
// @name                GitHub localization
// @name:zh-CN     GitHub汉化插件
// @version             1.0
// @description       Translate GitHub.com
// @description:zh      GitHub汉化插件
// @description:zh-CN   GitHub汉化插件
// @author              Iuleoo
// @match               https://github.com/*
// @grant               GM_xmlhttpRequest
// @grant               GM_getResourceText
// @resource            zh-CN https://raw.githubusercontent.com/Iuleoo/GitHub_loc/master/locales/zh-CN.json
// @resource            ja https://raw.githubusercontent.com/Iuleoo/GitHub_loc/master/locales/ja.json
// @require             https://cdn.bootcdn.net/ajax/libs/timeago.js/4.0.2/timeago.full.min.js
// @require             https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// ==/UserScript==

(function() {
  'use strict';

  const SUPPORT_LANG = ["zh-CN", "ja"];
  const lang = (navigator.language || navigator.userLanguage);
  const locales = getLocales(lang)

  translateByCssSelector();
  translateDesc();
  traverseElement(document.body);
  watchUpdate();

  function getLocales(lang) {
    if(lang.startsWith("zh")) { // zh zh-TW --> zh-CN
      lang = "zh-CN";
    }
    if(SUPPORT_LANG.includes(lang)) {
      return JSON.parse(GM_getResourceText(lang));
    }
    return {
      css: [],
      dict: {}
    };
  }

  function translateRelativeTimeEl(el) {
    const datetime = $(el).attr('datetime');
    $(el).text(timeago.format(datetime, lang.replace('-', '_')));
  }

  function translateElement(el) {
    // Get the text field name
    let k;
    if(el.tagName === "INPUT") {
      if (el.type === 'button' || el.type === 'submit') {
        k = 'value';
      } else {
        k = 'placeholder';
      }
    } else {
      k = 'data';
    }

    const txtSrc = el[k].trim();
    const key = txtSrc.toLowerCase()
        .replace(/\xa0/g, ' ') // replace '&nbsp;'
        .replace(/\s{2,}/g, ' ');

    if(locales.dict[key]) {
      el[k] = el[k].replace(txtSrc, locales.dict[key])
    }
  }

  function shoudTranslateEl(el) {
    const blockIds = ["readme"];
    const blockTags = ["CODE", "SCRIPT", "LINK", "IMG", "svg", "TABLE", "ARTICLE"];

    return !(el.id && blockIds.includes(el.id))
      && !(blockTags.includes(el.tagName));
  }

  function traverseElement(el) {
    if(!shoudTranslateEl(el)) {
      return
    }

    for(const child of el.childNodes) {
      if(["RELATIVE-TIME", "TIME-AGO"].includes(el.tagName)) {
        translateRelativeTimeEl(el);
        return;
      }

      if(child.nodeType === Node.TEXT_NODE) {
        translateElement(child);
      }
      else if(child.nodeType === Node.ELEMENT_NODE) {
        if(child.tagName === "INPUT") {
          translateElement(child);
        } else {
          traverseElement(child);
        }
      } else {
        // pass
      }
    }
  }

  function watchUpdate() {
    const m = window.MutationObserver || window.WebKitMutationObserver;
    const observer = new m(function (mutations, observer) {
      for(let mutationRecord of mutations) {
        for(let node of mutationRecord.addedNodes) {
          traverseElement(node);
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      characterData: true,
      childList: true,
    });
  }

  // translate "about"
  function translateDesc() {
    $(".repository-content .f4").append("<br/>");
    $(".repository-content .f4").append("<a id='translate-me' href='#' style='color:rgb(27, 149, 224);font-size: small'>翻译</a>");
    $("#translate-me").click(function() {
      // get description text
      const desc = $(".repository-content .f4")
        .clone()
        .children()
        .remove()
        .end()
        .text()
        .trim();

      if(!desc) {
        return;
      }

      GM_xmlhttpRequest({
        method: "GET",
        url: `https://www.githubs.cn/translate?q=`+ encodeURIComponent(desc),
        onload: function(res) {
          if (res.status === 200) {
            $("#translate-me").hide();
            // render result
            const text = res.responseText;
            $(".repository-content .f4").append("<span style='font-size: small'>TK翻译</span>");
            $(".repository-content .f4").append("<br/>");
            $(".repository-content .f4").append(text);
          } else {
            alert("翻译失败");
          }
        }
      });
    });
  }

  function translateByCssSelector() {
    if(locales.css) {
      for(var css of locales.css) {
        if($(css.selector).length > 0) {
          if(css.key === '!html') {
            $(css.selector).html(css.replacement);
          } else {
            $(css.selector).attr(css.key, css.replacement);
          }
        }
      }
    }
  }
})();