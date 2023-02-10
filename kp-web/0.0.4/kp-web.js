/*
 * kpWeb JavaScript Library
 * https://github.com/vattik/libs/tree/main/kp-web
 * Date: 2023-02-09
 * 
 * Dependencies: PageDOM
 */

{
    const LIB = globalThis.kpWeb || {};
    LIB.version = '0.0.4';

    const document = globalThis.document;

    const patternCountry = /^[А-яЙйЁё][-(\'’ А-яЙйЁё]*[А-яЙйЁё]\)?$/; // Папуа - Новая Гвинея, Германия (ФРГ), острова Теркс и Кайкос, Кот-д’Ивуар
    const patternGenre = /^[А-яЙйЁё][- А-яЙйЁё]*[А-яЙйЁё]$/; // детектив, реальное ТВ, фильм-нуар
    const patternPersonName = /^[A-zА-яЙйЁё][-.\'’A-zА-яЙйЁё ]*[A-zА-яЙйЁё]\.?$/; // г-н. Сергей Бодров мл.
    const patternMPAA = /^(?:MPAA[:\s]+)?([A-Z\d][-A-Z\d]*)$/i; // R    |    PG-13

    const blankFields = {
        "id": null, // www.kinopoisk.ru
        "contentId": "", // hd.kinopoisk.ru
        "type": "",
        "poster": "",
        "name": "",
        "origname": "",
        "shortDescription": "",
        "year": null,
        "country": [],
        "genre": [],
        "slogan": "",
        "director": [],
        "age": "",
        "mpaa": "",
        "duration": null,
        "actor": [],
        "description": ""
    };

    const parse = function(dom = null, url = null) {
        if (dom === null) dom = document;
        if (url === null) url = dom.location;
        const result = Object.create(blankFields);

        let jsonLd = {};
        try {
            const jsonLdVal = dom.querySelector('script[type="application/ld+json"]').textContent;
            jsonLd = JSON.parse(jsonLdVal);
        } catch {}

        let jsonNext = {};
        try {
            const jsonNextVal = dom.querySelector('script#__NEXT_DATA__').textContent;
            const jsonNextData = JSON.parse(jsonNextVal).props.apolloState.data;
            jsonNext = jsonNextData;
        } catch {}

        const urlValues = [];
        if (url) {
            urlValues.push(url);
        }
        if (jsonLd.url) {
            urlValues.push(jsonLd.url);
        }
        const linkCanonicalNode = dom.querySelector('link[rel="canonical"]');
        if (linkCanonicalNode && linkCanonicalNode.hasAttribute('href')) {
            const linkCanonical = linkCanonicalNode.getAttribute('href');
            if (linkCanonical) {
                urlValues.push(linkCanonical);
            }
        }
        const ogUrlNode = dom.querySelector('meta[property="og:url"]');
        if (ogUrlNode && ogUrlNode.hasAttribute('content')) {
            const ogUrl = ogUrlNode.getAttribute('content');
            if (ogUrl) {
                urlValues.push(ogUrl);
            }
        }
        const URLsText = urlValues.join('\n');
        const IDs = /\/(\d+)\//.exec(URLsText);
        result.id = IDs !== null ? Number(IDs[1]) : null;

        let contentId = null;
        if (result.id) {
            try {
                contentId = 'Film:' + result.id in jsonNext && 'contentId' in jsonNext['Film:' + result.id]
                ? jsonNext['Film:' + result.id].contentId : jsonNext['TvSeries:' + result.id].contentId;
            } catch {}
        }
        result.contentId = contentId ?? "";

        result.type = isSeries(dom, URLsText) ? "series" : "film";

        result.poster = jsonLd.image ?? "";
        
        result.name = jsonLd.name ?? PageDOM.findSingleNode('descendant::h1[normalize-space(@itemprop)="name"]/*[normalize-space()][1]', dom) ?? "";
        const nameValues = [];
        const ogTitleNode = dom.querySelector('meta[property="og:title"]');
        if (ogTitleNode && ogTitleNode.hasAttribute('content')) {
            const ogTitle = ogTitleNode.getAttribute('content');
            if (ogTitle) {
                nameValues.push(ogTitle);
            }
        }
        const twitterTitleNode = dom.querySelector('meta[property="twitter:title"]');
        if (twitterTitleNode && twitterTitleNode.hasAttribute('content')) {
            const twitterTitle = twitterTitleNode.getAttribute('content');
            if (twitterTitle) {
                nameValues.push(twitterTitle);
            }
        }
        const posterNode = dom.querySelector('img.film-poster');
        if (posterNode && posterNode.hasAttribute('alt')) {
            const posterAlt = posterNode.getAttribute('alt');
            if (posterAlt) {
                nameValues.push(posterAlt);
            }
        }
        if (result.name && nameValues.length && nameValues.join('\n').indexOf(result.name) === -1) {
            result.name = result.name.replace(/\s*\(\s*\d{4}\s*\)$/, ''); // remove year
        }

        result.origname = jsonLd.alternateName ?? jsonLd.alternativeHeadline ?? PageDOM.findSingleNode('descendant::*[contains(@class,"styles_o' + 'riginalTi'+'tle__") and count(descendant::text()[normalize-space()])=1]', dom) ?? "";

        // Example kpID: 1007049
        result.shortDescription = PageDOM.findSingleNode('descendant::*[contains(@class,"styles_to'+ 'pText__")]/descendant::text()[normalize-space() and not(ancestor::*[contains(@class,"styles_edi'+'torAnno' +'tation__")])]', dom) ?? "";

        result.year = jsonLd.datePublished && /^\d{4}$/.test(jsonLd.datePublished) ? Number(jsonLd.datePublished) : PageDOM.findSingleNode('descendant::*[count(*)=2 and *[1][normalize-space()="Год производства"]]/*[2]/*[normalize-space()][1]', dom, true, /^\d{4}$/);

        let countries = [];
        if (typeof(jsonLd.countryOfOrigin) === 'object' && jsonLd.countryOfOrigin.length) {
            for (const cValue of jsonLd.countryOfOrigin) {
                if (patternCountry.test(cValue)) {
                    countries.push(cValue);
                } else {
                    countries = [];
                    break;
                }
            }
        }
        if (countries.length === 0) {
            countries = PageDOM.findNodes('descendant::*[count(*)=2 and *[1][normalize-space()="Страна"]]/*[2]/a[normalize-space()]', dom, patternCountry);
            if (countries.indexOf(null) !== -1) {
                countries = [];
            }
        }
        if (countries.length) {
            result.country = countries;
        }

        let genres = [];
        if (typeof(jsonLd.genre) === 'object' && jsonLd.genre.length) {
            for (const gValue of jsonLd.genre) {
                if (patternGenre.test(gValue)) {
                    genres.push(gValue);
                } else {
                    genres = [];
                    break;
                }
            }
        }
        if (genres.length === 0) {
            genres = PageDOM.findNodes('descendant::*[count(*)=2 and *[1][normalize-space()="Жанр"]]/*[2]/*[normalize-space()][1]/a[normalize-space()]', dom, patternGenre);
            if (genres.indexOf(null) !== -1) {
                genres = [];
            }
        }
        if (genres.length) {
            result.genre = genres;
        }

        let slogan = PageDOM.findSingleNode('descendant::*[count(*)=2 and *[1][normalize-space()="Слоган"]]/*[2]/*[normalize-space()][1][not(normalize-space()="-" or normalize-space()="—")]', dom);
        const matches = /^[«][ ]*(.{2,}?)[ ]*[»]$/.exec(slogan);
        if (matches) { slogan = matches[1]; }
        result.slogan = slogan ?? "";

        let directors = [];
        if (typeof(jsonLd.director) === 'object' && jsonLd.director.length) {
            for (const person of jsonLd.director) {
                if (person.name && patternPersonName.test(person.name)) {
                    directors.push(person.name);
                } else {
                    directors = [];
                    break;
                }
            }
        }
        if (directors.length === 0) {
            directors = PageDOM.findNodes('descendant::*[count(*)=2 and *[1][normalize-space()="Режиссёр" or normalize-space()="Режиссер"]]/*[2]/a[normalize-space()]', dom, patternPersonName);
            if (directors.indexOf(null) !== -1) {
                directors = [];
            }
        }
        if (directors.length) {
            result.director = directors;
        }

        result.age = PageDOM.findSingleNode('descendant::*[count(*)=2 and *[1][normalize-space()="Возраст"]]/*[2]/descendant::text()[normalize-space()][1]/..', dom, false, /^\d{1,2}\+$/) ?? "";

        if (jsonLd.contentRating) {
            const matches = patternMPAA.exec(jsonLd.contentRating);
            if (matches) {
                result.mpaa = matches[1];
            }
        } else {
            result.mpaa = PageDOM.findSingleNode('descendant::*[count(*)=2 and *[1][normalize-space()="Рейтинг MPAA"]]/*[2]/descendant::text()[normalize-space()][1]/..', dom, false, patternMPAA) ?? "";
        }

        result.duration = jsonLd.timeRequired && /^\d{1,3}$/.test(jsonLd.timeRequired) ? Number(jsonLd.timeRequired) : PageDOM.findSingleNode('descendant::*[count(*)=2 and *[1][normalize-space()="Время"]]/*[2]/*[normalize-space()][1]', dom, false, /^(\d{1,3})\s*м/i);

        let actors = PageDOM.findNodes('descendant::*/*[normalize-space()][1][starts-with(normalize-space(),"В главных ролях")]/following-sibling::*[1]/li/a[normalize-space()]', dom, patternPersonName);
        if (actors.indexOf(null) !== -1) {
            actors = [];
        }
        if (actors.length === 0 && typeof(jsonLd.actor) === 'object' && jsonLd.actor.length) {
            for (const person of jsonLd.actor) {
                if (person.name && patternPersonName.test(person.name)) {
                    actors.push(person.name);
                } else {
                    actors = [];
                    break;
                }
            }
        }
        if (actors.length) {
            result.actor = actors;
        }

        const synopsisRows = PageDOM.findNodes('descendant::div[ not(.//div) and contains(@class,"styles' + '_filmS'+ 'ynopsis__")]/p[string-length(normalize-space())>1]', dom);
        if (synopsisRows.length) {
            result.description = synopsisRows.join('\n\n').replace(/[ ]+/g, ' ');
        } else {
            result.description = jsonLd.description ?? "";
        }

        return result;
    };

    const isSeries = function(dom, URLsText) {
        if (/^https?:\/\/(?:www\.)?[-a-z\d]{3,}\.[a-z]{2,}\/series\/.+/i.test(URLsText)
            || /^.+ \([^)(]*сериал(?:[ ,]|\))/i.test(dom.title)
            || /^\([^)(]*сериал(?:[ ,]|\))/i.test( PageDOM.findSingleNode('descendant::h1[normalize-space(@itemprop)="name"]/*[normalize-space()][2]', dom) )
            || PageDOM.findSingleNode('descendant::*[count(*)=2 and *[1][normalize-space()="Год производства"]]/*[2]', dom, true, /сезон/i)
        ) {
            return true;
        }
        return false;
    };

    LIB.parse = parse;
    globalThis.kpWeb = LIB;
}
