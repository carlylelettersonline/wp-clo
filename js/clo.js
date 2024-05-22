class CarlyleLettersOnline {
    constructor(corpora_host, corpora_token, clo_corpus_id, plugin_url) {
        this.host = corpora_host
        this.token = corpora_token
        this.corpus_id = clo_corpus_id
        this.plugin_url = plugin_url
        this.site_header = null
        this.site_footer = null
        this.homepage_widget = null
        this.volume_batch_widget = null
        this.volume_viewer_widget = null
        this.photo_album_widget = null
        this.album_viewer_widget = null
        this.search_results_widget = null

        let sender = this

        // rig up the site header
        let clo_site_header = jQuery('#clo-header-div')
        if (clo_site_header.length) {
            this.load_template(
                clo_site_header,
                'header.html',
                function() {
                    let search_bar = jQuery('.clo-search-bar')
                    search_bar.keyup(function(e) {
                        if (e.key === "Enter") {
                            let query = search_bar.val().trim()
                            if (query) {
                                window.location.href = `/search-results/${query}`
                            }
                        }
                    })
                })
        }

        // rig up the site footer
        let clo_site_footer_div = jQuery('#clo-footer-div')
        if (clo_site_footer_div.length) {
            this.load_template(clo_site_footer_div, 'footer.html')
        }

        // rig up homepage widget
        let clo_homepage_widget_div = jQuery('#clo-homepage-widget-div')
        if (clo_homepage_widget_div.length) {
            this.homepage_widget = new HomePageWidget(this, clo_homepage_widget_div)
        }

        // rig up volume batches
        let clo_volume_batch_div = jQuery('#clo-volume-batch-div')
        if (clo_volume_batch_div.length) {
            this.volume_batch_widget = new VolumeBatch(this, clo_volume_batch_div)
        }

        // rig up volume viewer
        let clo_volume_navigator_div = jQuery('#clo-volume-navigator-div')
        let clo_letter_viewer_div = jQuery('#clo-letter-viewer-div')
        if (clo_volume_navigator_div.length && clo_letter_viewer_div) {
            this.volume_viewer_widget = new VolumeViewer(this, clo_volume_navigator_div, clo_letter_viewer_div)
        }

        // rig up photo albums
        let clo_photo_album_div = jQuery('#clo-photo-album-div')
        if (clo_photo_album_div.length) {
            this.photo_album_widget = new PhotoAlbum(this, clo_photo_album_div)
        }

        // rig up album viewer
        let clo_album_viewer_div = jQuery('#clo-album-viewer-div')
        if (clo_album_viewer_div.length) {
            this.album_viewer_widget = new AlbumViewer(this, clo_album_viewer_div)
        }

        // rig up search results viewer
        let clo_search_results_div = jQuery('#clo-search-results-div')
        if (clo-clo_search_results_div.length) {
            this.search_results_widget = new SearchResultsViewer(this, clo_search_results_div)
        }
    }

    make_request(path, type, params={}, callback, inject_host=true) {
        let url = path
        if (inject_host) url = `${this.host}${path}`

        let req = {
            type: type,
            url: url,
            dataType: 'json',
            crossDomain: true,
            data: params,
            success: callback
        }

        if (this.token) {
            let sender = this
            req['beforeSend'] = function(xhr) { xhr.setRequestHeader("Authorization", `Token ${sender.token}`) }
        }

        return jQuery.ajax(req)
    }

    random_index(length) {
        return Math.floor(Math.random() * length)
    }

    count_instances(a_string, instance) {
        return a_string.split(instance).length
    }

    title_case(str) {
        if (str.length > 3) {
            let phrase = str.toLowerCase().split(' ')
            console.log(phrase)
            for (let word_index = 0; word_index < phrase.length; word_index++) {
                if (phrase[word_index].length > 3) {
                    phrase[word_index] = phrase[word_index].charAt(0).toUpperCase() + phrase[word_index].slice(1)
                } else if (!['and', 'the'].includes(phrase[word_index])) {
                    let new_word = ''
                    for (let char_index = 0; char_index < phrase[word_index].length; char_index++) {
                        new_word += phrase[word_index][char_index].toUpperCase()
                    }
                    phrase[word_index] = new_word
                }
            }
            return phrase.join(' ')
        }
        return str
    }

    sanitize(a_string) {
        const div = document.createElement('div')
        div.textContent = a_string
        return div.innerHTML
    }

    load_template(element, template, callback=null, prepend_url=false) {
        let sender = this
        element.load(`${this.plugin_url}templates/${template}`, function() {
            if (prepend_url) {
                element.find('[data-url-prepend-attr]').each(function() {
                    let el = jQuery(this)
                    let attr = el.data('url-prepend-attr')
                    let val = el.attr(attr)

                    el.attr(attr, `${sender.plugin_url}${val}`)
                })
            }

            if (callback) callback()
        })
    }

}

class HomePageWidget {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element
        this.quotes = [
            "What we become depends on what we read after all of the professors are done with us. The greatest university of all is a collection of books.",
            "I've got a great ambition to die of exhaustion rather than boredom.",
            "All that mankind has done, thought, gained, or been; it is lying as in magic preservation in the pages of books.",
            "Go as far as you can see; when you get there, you'll be able to see further.",
            "A loving heart is the beginning of all knowledge.",
            "Conviction is worthless unless it is converted into conduct.",
            "A loving heart is the beginning of all knowledge.",
            "Conviction is worthless unless it is converted into conduct.",
            "Every man is my superior in that I may learn from him.",
            "The tragedy of life is not so much what men suffer, but rather what they miss.",
            "Popular opinion is the greatest lie in the world."
        ]

        let sender = this

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/Photo/`,
            'GET',
            {'e_frontispiece_volume.label': 'y', 'only': 'iiif_url', 'page-size': 60},
            function(photos) {
                if (photos.hasOwnProperty('records') && photos.records.length) {
                    let rand_photo_1 = sender.clo.random_index(photos.records.length)
                    let rand_photo_2 = sender.clo.random_index(photos.records.length)
                    let rand_quote = sender.clo.random_index(sender.quotes.length)
                    while (rand_photo_2 === rand_photo_1) rand_photo_2 = sender.clo.random_index(photos.records.length)

                    rand_photo_1 = `${photos.records[rand_photo_1].iiif_url}/full/,200/0/default.jpg`
                    rand_photo_2 = `${photos.records[rand_photo_2].iiif_url}/full/,200/0/default.jpg`
                    rand_quote = sender.quotes[rand_quote]

                    sender.element.html(`
                        <div class="d-flex flex-column flex-grow-1 justify-content-start align-items-center px-4">
                          <div class="row mt-3 mb-3">
                            <img src="${rand_photo_1}" class="portrait pr-3">
                            <img src="${rand_photo_2}" class="portrait pl-3">
                          </div>
                          <div class="clo-quote-container mt-3">
                            <p>“${rand_quote}”</p>
                          </div>
                        </div>
                    `)
                }
            }
        )
    }
}


class VolumeBatch {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element

        let sender = this

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/VolumeBatch/`,
            'GET',
            {'s_order': 'asc', 'page-size': 50},
            function (data) {
                if (data.hasOwnProperty('records')) {
                    let html_template = (batches) => {
                        return `
                            <div class="row">
                                <div class="col-sm-6">${batches[0]}</div>
                                <div class="col-sm-6">${batches[2]}</div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">${batches[1]}</div>
                                <div class="col-sm-6">${batches[3]}</div>
                            </div>
                        `
                    }

                    let batches = []
                    data.records.map((record, record_index) => {
                        let min_vol_no = record.volumes[0].volume_no
                        let max_vol_no = record.volumes[record.volumes.length - 1].volume_no
                        let vol_links = record.volumes.map(vol => `<a href="/volume/${vol.volume_no}/frontispiece" class="clo-volume-link">${vol.label}: ${vol.description}</a>`)

                        batches.push(`
                            <div class="clo-volume-batch">
                                <h6 class="mb-0">${record.title}<br />${record.date_range}</h6>
                                <details class="mt-1 mb-1">
                                    <summary>Volumes ${min_vol_no} - ${max_vol_no}</summary>
                                    ${vol_links.join('<br />')}
                                </details>
                                <div class="clo-volume-batch-selected-content">
                                    ${record.selected_contents}
                                </div>
                            </div>
                        `)
                    })

                    sender.element.append(html_template(batches))
                }
            }
        )
    }
}


class VolumeViewer {
    constructor(clo_instance, nav_element, viewer_element) {
        this.clo = clo_instance
        this.nav_element = nav_element
        this.viewer_element = viewer_element
        this.volume = null
        this.letter = null
        this.max_vol_no = null
        this.all_letter_dois = []
        this.doi_toc_map = {}
        this.front_slug_id_map = {}
        this.highlight = null
        this.dragon = null

        // check for url path parameters
        let path_parts = window.location.pathname.split('/')
        if (path_parts.length === 5) {
            this.volume = path_parts[2]
            this.letter = path_parts[3]

            if (!isNaN(this.volume)) {
                this.volume = parseInt(this.volume)
            }

            if (window.location.search) {
                let get_params = new URLSearchParams(window.location.search)
                this.highlight = get_params.get('highlight')
            }
        }

        let sender = this
        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/LetterVolume/`,
            'GET',
            {'f_volume_no': sender.volume, 'only': 'id'},
            function (data) {
                if (data.hasOwnProperty('records') && data.records.length === 1) {
                    let volume_id = data.records[0].id
                    sender.clo.make_request(
                        `/api/corpus/${sender.clo.corpus_id}/LetterVolume/`,
                        'GET',
                        {
                            f_id: volume_id,
                            only: 'label,description,front_matters.id,front_matters.label,front_matters.slug,letters.id,letters.date,letters.label,letters.description,letters.doi'
                        },
                        function (vol_data) {
                            if (vol_data.hasOwnProperty('records') && vol_data.records.length === 1) {
                                let vol = vol_data.records[0]
                                let front_matters = vol.front_matters.map(front_matter => {
                                    let label = front_matter.label.replaceAll('&lt;', '<').replaceAll('&gt;', '>')

                                    sender.front_slug_id_map[front_matter.slug] = front_matter.id

                                    return `<div class="clo-vol-front-matter-div">
                                        <a class="clo-vol-front-matter-link clo-vol-nav-link"
                                                data-text-type="FrontMatter"
                                                data-slug="${front_matter.slug}"
                                                data-id="${front_matter.id}">
                                            ${label}
                                        </a>
                                     </div>`
                                })

                                let letters = '<details id="clo-vol-toc-letters"><summary>LETTERS</summary>'
                                let month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                                let last_month = ''

                                vol.letters.map(letter => {
                                    if (letter.date) {
                                        let d = new Date(Date.parse(letter.date))
                                        let month_label = `${month_names[d.getMonth()]} ${d.getFullYear()}`

                                        if (month_label !== last_month) {
                                            if (last_month) {
                                                letters += '</details>'
                                            }
                                            letters += `<details id="clo-vol-toc-${month_label.replace(' ', '')}" class="clo-vol-toc-date"><summary>${month_label}</summary>`
                                            last_month = month_label
                                        }

                                        letters += `
                                            <div class="clo-vol-letter-link-div">
                                                <a class="clo-vol-letter-link clo-vol-nav-link" data-text-type="Letter" data-id="${letter.id}" data-doi="${letter.doi}">
                                                    <span class="clo-vol-letter-link-date">${letter.label}</span><br />
                                                    <span class="clo-vol-letter-link-desc">${letter.description}</span>
                                                </a>
                                            </div>
                                        `

                                        sender.all_letter_dois.push(letter.doi)
                                        sender.doi_toc_map[letter.doi] = `clo-vol-toc-${month_label.replace(' ', '')}`
                                    }
                                })
                                letters += `</details></details>`

                                sender.nav_element.append(`
                                    <div id="clo-vol-info" class="orange-border-bottom">
                                      ${vol.label}<br />${vol.description}
                                    </div>
                                    <div id="clo-vol-nav">
                                      <a id="clo-vol-prev" class="mr-auto vol-nav-link" data-direction="prev">PREV VOLUME</a>
                                      <a id="clo-vol-next" class="ml-auto vol-nav-link" data-direction="next">NEXT VOLUME</a>
                                    </div>
                                    ${front_matters.join('')}
                                    ${letters}
                                `)

                                if (!sender.max_vol_no) {
                                    sender.clo.make_request(
                                        `/api/corpus/${sender.clo.corpus_id}/LetterVolume/`,
                                        'GET',
                                        {'a_max_volno': 'volume_no', 'page-size': 0},
                                        function (data) {
                                            if (data.hasOwnProperty('meta') && data.meta.hasOwnProperty('aggregations') && data.meta.aggregations.hasOwnProperty('volno')) {
                                                sender.max_vol_no = parseInt(data.meta.aggregations.volno)
                                                sender.fix_navigation()
                                            }
                                        }
                                    )
                                }

                                if (sender.letter === 'frontispiece') {
                                    sender.clo.make_request(
                                        `/api/corpus/${sender.clo.corpus_id}/Photo/`,
                                        'GET',
                                        {'f_frontispiece_volume.id': volume_id, 'only': 'iiif_url,description'},
                                        function (frontis) {
                                            sender.viewer_element.append(`
                                                <div class="clo-letter-frontispiece-div">
                                                    <img src="${frontis.records[0].iiif_url}/full/full/0/default.jpg" class="clo-letter-frontispiece-image" />
                                                    <div class="clo-letter-frontispiece-caption">${frontis.records[0].description ? frontis.records[0].description : ''}</div>
                                                </div>
                                            `)
                                        }
                                    )
                                } else if (sender.letter.startsWith('lt-')) {
                                    sender.clo.make_request(
                                        `/api/corpus/${sender.clo.corpus_id}/Letter/?f_doi=${sender.letter}&only=id`,
                                        'GET',
                                        {
                                            f_doi: sender.letter,
                                            only: 'id'
                                        },
                                        function (data) {
                                            if (data.hasOwnProperty('records') && data.records.length) {
                                                sender.render_content('Letter', data.records[0].id)
                                            }
                                        }
                                    )
                                } else if (sender.letter in sender.front_slug_id_map) {
                                    sender.render_content('FrontMatter', sender.front_slug_id_map[sender.letter])
                                }
                            }
                        }
                    )
                }
            }
        )
    }

    fix_navigation() {
        let sender = this
        let nav_links = jQuery('.clo-vol-nav-link')

        if (this.max_vol_no) {
            if (this.volume < 2) jQuery('#clo-vol-prev').hide()
            if (this.volume >= this.max_vol_no) jQuery('#clo-vol-next').hide()
        }

        nav_links.removeClass('active')

        if (this.all_letter_dois.includes(this.letter)) {
            let letter_index = this.all_letter_dois.indexOf(this.letter)
            let prev_btns = jQuery('.clo-letter-nav-link.prev')
            let next_btns = jQuery('.clo-letter-nav-link.next')
            let letters_toc = jQuery('#clo-vol-toc-letters')
            let date_toc = jQuery(`#${sender.doi_toc_map[this.letter]}`)
            let letter_link = jQuery(`a.clo-vol-letter-link[data-doi=${this.letter}]`)

            letter_index > 0 ? prev_btns.show() : prev_btns.hide()
            letter_index === this.all_letter_dois.length - 1 ? next_btns.hide() : next_btns.show()

            jQuery('.clo-vol-toc-date').removeAttr('open')
            letters_toc.attr('open', true)
            date_toc.attr('open', true)
            letter_link.addClass('active')
        } else if (this.letter in this.front_slug_id_map) {
            let frontmatter_link = jQuery(`a.clo-vol-front-matter-link[data-id=${this.front_slug_id_map[this.letter]}]`)
            frontmatter_link.addClass('active')
        }

        // volume navigation
        jQuery('.vol-nav-link').click(function() {
            let direction = jQuery(this).data('direction')

            if (direction === 'prev' && sender.volume > 1) window.location.href = `/volume/${sender.volume - 1}/frontispiece`
            else if (direction === 'next' && sender.volume < sender.max_vol_no) window.location.href = `/volume/${sender.volume + 1}/frontispiece`
        })

        // TOC navigation
        nav_links.click(function() {
            let link = jQuery(this)
            sender.render_content(link.data('text-type'), link.data('id'))
            sender.clo.site_header.element[0].scrollIntoView()
        })

        // letter navigation
        jQuery('.clo-letter-nav-link').click(function() {
            let link = jQuery(this)
            let letter_doi_index = sender.all_letter_dois.indexOf(sender.letter)
            let subsequent_doi = null

            if (link.hasClass('prev') && letter_doi_index > 0) {
                subsequent_doi = sender.all_letter_dois[letter_doi_index - 1]
            } else if (link.hasClass('next') && letter_doi_index < sender.all_letter_dois.length - 1) {
                subsequent_doi = sender.all_letter_dois[letter_doi_index + 1]
            }

            if (subsequent_doi !== null) {
                let letter_link = jQuery(`a.clo-vol-letter-link[data-doi=${subsequent_doi}]`)
                let subsequent_id = letter_link.data('id')
                sender.render_content('Letter', subsequent_id)
            }
        })

        // footnote navigation
        jQuery('.footnote').click(function() {
            let link = jQuery(this)
            let note_no = link.data('note_number')

            if (link.hasClass('origin')) {
                let footnotes = jQuery('#clo-letter-footnotes-div')
                if (!footnotes.is('[open]')) {
                    footnotes.attr('open', true)
                }
                let target_note = jQuery(`a.footnote.target[data-note_number=${note_no}]`)
                if (target_note.length) {
                    target_note[0].scrollIntoView()
                }
            } else if (link.hasClass('target')) {
                let origin_note = jQuery(`sup.footnote.origin[data-note_number=${note_no}]`)
                if (origin_note.length) {
                    origin_note[0].scrollIntoView()
                }
            }
        })
    }

    render_content(content_type, content_id, slug=null) {
        let sender = this

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/${content_type}/${content_id}/`,
            'GET',
            {},
            function (content) {
                if (content.hasOwnProperty('content_type')) {
                    sender.viewer_element.empty()

                    // build footnotes div if necessary
                    let footnotes_div = ''
                    if (content.hasOwnProperty('footnotes') && content.footnotes.length) {
                        footnotes_div = `
                            <details id="clo-letter-footnotes-div">
                                <summary>Footnotes</summary>
                                <div class="clo-note-div">
                        `

                        content.footnotes.map((note, index) => {
                            footnotes_div += `<p><a class="footnote target" data-note_number="${index + 1}">${index + 1}</a>${note}</p>\n`
                        })

                        footnotes_div += `
                                </div>
                            </details>`
                    }

                    // render front matter
                    if (content.content_type === 'FrontMatter') {
                        sender.letter = content.slug
                        history.replaceState(null, content.title, `/volume/${sender.volume}/${content.slug}`)
                        sender.viewer_element.html(`
                            <div id="clo-letter-content-div">
                                <b class="ml-auto mr-auto mb-2">${content.title}</b>
                                ${content.html}
                            </div>
                            
                            ${footnotes_div}
                        `)

                    // render letter
                    } else if (content.content_type === 'Letter') {
                        sender.letter = content.doi
                        history.replaceState(null, content.date_label, `/volume/${sender.volume}/${content.doi}`)
                        let letter_nav = `
                            <div class="clo-letter-nav-div">
                              <a class="clo-letter-nav-link prev">&lt; PREVIOUS</a>
                              <a class="clo-letter-nav-link next">NEXT &gt;</a>
                            </div>
                        `

                        let content_div = `
                            <div id="clo-letter-content-div">
                              <p>${content.description}; ${content.date_label}; DOI 10.1215/${content.doi}</p>
                              <p><b>${content.description}</b></p>
                              ${content.html}
                            </div>
                        `

                        let sourcenote_div = `
                            <details id="clo-letter-sourcenote-div">
                                <summary>Sourcenote</summary>
                                <div class="clo-note-div">
                                    ${content.sourcenote}
                                </div>
                            </details>
                        `

                        if (content.hasOwnProperty('page_images') && content.page_images.length) {
                            sender.viewer_element.html(`
                                ${letter_nav}
                                <div id="clo-letter-image-helper">
                                    Scroll down to see the transcription and notes for this letter.
                                </div>
                                <div id="clo-letter-image-viewer"></div>
                                ${content_div}
                                ${sourcenote_div}
                                ${footnotes_div}
                                ${letter_nav}
                            `)

                            sender.dragon = OpenSeadragon({
                                id:                 "clo-letter-image-viewer",
                                prefixUrl:          "/wp-content/plugins/clo/js/openseadragon/images/",
                                preserveViewport:   false,
                                visibilityRatio:    1,
                                minZoomLevel:       .25,
                                maxZoomLevel:       5,
                                defaultZoomLevel:   0,
                                homeFillsViewer:    true,
                                showRotationControl: true,
                                tileSources:   [content.page_images],
                                sequenceMode: true,
                                showReferenceStrip: true,
                                referenceStripScroll: 'horizontal',
                            })

                            sender.dragon.addHandler('open', function () {
                                let tiledImage = sender.dragon.world.getItemAt(0)
                                if (tiledImage.getFullyLoaded())
                                    sender.show_top_of_letter()
                                else
                                    tiledImage.addOnceHandler('fully-loaded-change', function() { sender.show_top_of_letter() })
                            })

                        } else {
                            sender.viewer_element.html(`
                                ${letter_nav}
                                ${content_div}
                                ${sourcenote_div}
                                ${footnotes_div}
                                ${letter_nav}
                            `)
                        }
                    }

                    if (sender.highlight) {
                        let highlights = sender.highlight.split('__')
                        highlights.forEach(highlight => {
                            jQuery('#clo-letter-content-div').mark(highlight, {className: `clo-letter-highlight`})
                            let footnotes_div = jQuery('#clo-letter-footnotes-div')
                            footnotes_div.attr('open', true)
                            footnotes_div.mark(highlight, {className: `clo-letter-highlight`})
                            let highlight_spans = jQuery('.clo-letter-highlight')
                            if (highlight_spans.length) {
                                highlight_spans[0].scrollIntoView()
                            }
                        })
                        sender.highlight = null
                    }

                    sender.fix_navigation()
                }
            }
        )
    }

    show_top_of_letter() {
        let top_point = new OpenSeadragon.Point(0,0)
        this.dragon.viewport.panTo(top_point)
        this.dragon.viewport.applyConstraints()
    }
}


class PhotoAlbum {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element

        let sender = this

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/PhotoAlbum/`,
            'GET',
            {'s_album_no': 'asc', 'only': 'title,album_no,description'},
            function (albums) {
                if (albums.hasOwnProperty('records') && albums.records.length) {
                    let html = '<div class="container mt-1"><div class="row"><div class="col-sm-6">'

                    albums.records.map((album, index) => {
                        html += `
                            <div class="pl-4">
                              <a class="clo-bold-orange" href="/album-viewer/${album.album_no}">${album.title}</a>
                              <p>${album.description}</p>
                            </div>
                        `

                        if (index === 3) html += '</div><div class="col-sm-6">'
                    })
                    html += '</div></div></div>'
                    sender.element.html(html)
                }
            }
        )
    }
}


class AlbumViewer {
    constructor(clo_instance, element, album=null) {
        this.clo = clo_instance
        this.element = element
        this.max_photo_width = 300
        this.all_album_photos = []
        this.month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        this.album_no = null
        this.photo_no = -1
        let sender = this

        this.photo_observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    sender.show_image(entry.target, sender.max_photo_width)
                }
            })
        }, { threshold: [0] })

        // determine album and optional photo numbers
        let path_parts = window.location.pathname.split('/')
        if (path_parts.length >= 4) {
            this.album_no = path_parts[2]
            if (!isNaN(this.album_no)) {
                this.album_no = parseInt(this.album_no)
            }
        }
        if (path_parts.length === 5) {
            this.photo_no = path_parts[3]
            if (!isNaN(this.photo_no)) {
                this.photo_no = parseInt(this.photo_no)
            }
        }

        if (album === null) this.build_album()
        else this.render_photos(album)

        // build image feature modal
        jQuery('body').append(`
            <div class="modal fade" id="clo-album-feature-modal" tabindex="-1" role="dialog" aria-labelledby="clo-album-feature-modal-label" aria-hidden="true">
                <div class="modal-dialog modal-xl" role="document">
                        <div id="clo-album-feature-modal-content" class="modal-content">
                            <div class="modal-header orange-border-bottom">
                                <h4 id="clo-album-feature-modal-label" class="modal-title mt-0"></h4>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div id="clo-album-feature-modal-body" class="modal-body">
                                <div id="clo-album-feature-image"></div>
                            </div>
                            <div id="clo-album-feature-modal-footer" class="modal-footer">
                                
                            </div>
                        </div>
                </div>
            </div>
        `)
    }

    build_album() {
        let sender = this
        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/PhotoAlbum/`,
            'GET',
            {'f_album_no': sender.album_no},
            function(album) {
                if (album.hasOwnProperty('records') && album.records.length === 1) {
                    album = album.records[0]
                    sender.render_photos(album)
                }
            }
        )
    }

    render_photos(album) {
        let sender = this
        let html = `
          <div class="container p-0">
            ${album.title ? `<h4 id="clo-album-viewer-title" class="clo-heading" data-album_title="${album.title}">${album.title}</h4>` : ''}
            <div class="d-flex justify-content-center">
              <div id="clo-album-viewer" class="w-100">
        `

        album.photos.map((photo, index) => {
            html += `
              <div class="clo-album-cell">
                <div class="clo-album-cell-matte">
                  <div class="clo-album-cell-inner">
                    <div class="clo-album-tooltiptext" tabindex="${index}">${photo.title}</div>
                    <img id="clo-album-photo-${photo.id}"
                         class="clo-album-photo clo-album-photo-placeholder"
                         src="/wp-content/plugins/clo/img/placeholder-image.jpeg"
                         data-iiif_url="${photo.iiif_url}"
                         data-photo_no="${index}"
                    >
                  </div>
                </div>
              </div>
            `

            sender.all_album_photos.push(photo)
        })

        html += `
             </div>
            </div>
          </div>
        `

        sender.element.html(html)
        let album_photos = jQuery('.clo-album-photo:not([data-observed])')

        setTimeout(() => {
            album_photos.each(function() {
                sender.photo_observer.observe(this)
                jQuery(this).data('observed', true)
            })
        }, 1500)

        album_photos.click(function() {
            sender.feature_image(parseInt(jQuery(this).data('photo_no')))
        })

        if (sender.photo_no > -1 && sender.photo_no < sender.all_album_photos.length)
            sender.feature_image(sender.photo_no)
    }

    feature_image(photo_no) {
        let photo_info = this.all_album_photos[photo_no]
        let photo_modal = jQuery('#clo-album-feature-modal')
        let photo_modal_label = jQuery('#clo-album-feature-modal-label')
        let photo_modal_body = jQuery('#clo-album-feature-modal-body')
        let photo_modal_image = jQuery('#clo-album-feature-image')
        let photo_modal_footer = jQuery('#clo-album-feature-modal-footer')
        let metadata_fields = [
            {field: 'description', label: 'Description', multi: false},
            {field: 'subjects', label: 'Subjects', multi: true},
            {field: 'date_taken', label: 'Date Taken', multi: false},
            {field: 'creators', label: 'Creators', multi: true},
            {field: 'media_type', label: 'Media Type', multi: false},
            {field: 'note', label: 'Note', multi: false},
            {field: 'source', label: 'Source', multi: false},
            {field: 'digital_specs', label: 'Digital Specifications', multi: false},
            {field: 'rights', label: 'Rights', multi: false},
            {field: 'language_note', label: 'Language Note', multi: false},
            {field: 'format', label: 'Format', multi: false},
            {field: 'publisher', label: 'Publisher', multi: false},
        ]

        photo_modal_label.html(photo_info.title)

        let metadata = `<table border="0" width="100%">`
        metadata_fields.map(f => {
            if (photo_info.hasOwnProperty(f.field) && ((f.multi && photo_info[f.field].length) || (!f.multi && photo_info[f.field]))) {
                let val = photo_info[f.field]
                if (f.multi) {
                    val = val.join('; ')
                } else if (f.field === 'date_taken') {
                    let d = new Date(Date.parse(val))
                    val = `${this.month_names[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
                }

                metadata += `
                    <tr>
                      <td class="clo-album-metadata-label" valign="top" align="right">${f.label}:</td>
                      <td class="clo-album-metadata-value" valign="top" align="left">${val}</td>
                    </tr>
                `
            }
        })
        metadata += `</table>`
        photo_modal_footer.html(metadata)
        setTimeout(() => {photo_modal_footer[0].scrollTop = 0}, 1000)
        photo_modal_image.empty()

        photo_modal.off('shown.bs.modal').on('shown.bs.modal', function() {
            photo_modal_image.css('height', `${photo_modal_body.height() - 10}px`)
            OpenSeadragon({
                id:                 "clo-album-feature-image",
                prefixUrl:          "/wp-content/plugins/clo/js/openseadragon/images/",
                preserveViewport:   false,
                visibilityRatio:    1,
                minZoomLevel:       .25,
                maxZoomLevel:       5,
                defaultZoomLevel:   0,
                //homeFillsViewer:    true,
                showRotationControl: true,
                tileSources:   [photo_info.iiif_url],
            })
        })

        photo_modal_footer.off('mouseover').on('mouseover', function() {
            photo_modal_image.css('height', `${photo_modal_body.height() - 110}px`)
        })
        photo_modal_footer.off('mouseout').on('mouseout', function() {
            photo_modal_image.css('height', `${photo_modal_body.height() - 10}px`)
        })

        photo_modal.modal()
    }

    show_image(el, max_photo_width) {
        let img = jQuery(el)
        if (!img.is('[rendered]')) {
            let sender = this
            let iiif_url = img.data('iiif_url')

            sender.clo.make_request(
                iiif_url,
                'GET',
                {},
                function(info) {
                    if (info.hasOwnProperty('width')) {
                        let max_width = info.width
                        if (max_width > max_photo_width) {
                            max_width = max_photo_width
                        }

                        iiif_url = `${iiif_url}/full/${max_width},/0/default.jpg`
                        img.attr('src', iiif_url)
                        img[0].onload = function() {
                            jQuery(this).removeClass('clo-album-photo-placeholder')
                        }
                        img.attr('rendered', true)

                        let photo_no = parseInt(img.data('photo_no'))
                        sender.all_album_photos[photo_no].max_width = info.width
                        sender.all_album_photos[photo_no].max_height = info.height
                    }
                },
                false
            )
        }
    }
}


class SearchResultsViewer {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element
        this.criteria = {
            letters: {
                page: 1,
                operator: 'and',
                'page-size': 50,
                highlight_fields: 'html,footnotes,sourcenote',
                only: 'doi,vol_no,sender.label,recipient.label,date_label',
                a_terms_senders: 'sender.name,sender.id',
                a_terms_recipients: 'recipient.name,recipient.id',
                a_max_maxdate: 'date',
                a_min_mindate: 'date',
                s_date: 'asc'
            },
            frontmatter: {
                page: 1,
                operator: 'or',
                'page-size': 50,
                highlight_fields: 'html,footnotes',
            },
            photos: {
                page: 1,
                operator: 'or',
                'page-size': 500,
                highlight_fields: 'title,description,note',
            }
        }
        this.page_thresholds = {
            letters: 0,
            frontmatter: 0,
            photos: 0
        }

        // check for url path parameters
        let path_parts = window.location.pathname.split('/')
        if (path_parts.length === 4) {
            this.query = decodeURI(path_parts[2])
            this.query = this.clo.sanitize(this.query)
        }

        let sender = this
        this.clo.load_template(this.element, 'advanced_search.html', function() {
            sender.search_box = jQuery('#adv-search-box')
            sender.search_button = jQuery('#adv-search-button')
            sender.content_checkboxes = jQuery('.adv-search-content-checkbox')
            sender.date_range = { min: {}, max: {}, apply: false }
            sender.from_year_box = jQuery('#adv-search-date-from-year-box')
            sender.from_month_box = jQuery('#adv-search-date-from-month-box')
            sender.from_day_box = jQuery('#adv-search-date-from-day-box')
            sender.to_year_box = jQuery('#adv-search-date-to-year-box')
            sender.to_month_box = jQuery('#adv-search-date-to-month-box')
            sender.to_day_box = jQuery('#adv-search-date-to-day-box')
            sender.date_filter_button = jQuery('#adv-search-dates-apply-button')
            sender.clear_filters_button = jQuery('#adv-search-clear-filter-button')
            sender.sort_box = jQuery('#adv-search-letters-sort-box')
            sender.current_result_label = jQuery('#adv-search-current-result')
            sender.letter_total_results_labels = jQuery('.adv-search-letters-total-results')
            sender.frontmatter_total_results_labels = jQuery('.adv-search-frontmatter-total-results')
            sender.photo_total_results_labels = jQuery('.adv-search-photos-total-results')
            sender.letter_results_pane = jQuery('#adv-search-letter-results')
            sender.frontmatter_results_pane = jQuery('#adv-search-frontmatter-results')
            sender.photo_results_pane = jQuery('#adv-search-photo-results')
            sender.frontmatter_volume_map = {}

            let table_props = {
                layout: {
                    topStart: 'search',
                    topEnd: null,
                    bottomStart: null,
                    bottomEnd: null
                },
                columns: [
                    { name: 'name', title: 'Name' },
                    { name: 'id', visible: false, searchable: false },
                ],
                scrollY: 200,
                deferRender: true,
                scroller: true,
                language: {
                    searchPlaceholder: 'Search...'
                }
            }

            sender.sender_table = new DataTable('#adv-search-sender-table', table_props)
            sender.sender_table.on('click', 'tbody tr', function() { sender.select_person(sender.sender_table.row(this), 'sender') })

            sender.recipient_table = new DataTable('#adv-search-recipient-table', table_props)
            sender.recipient_table.on('click', 'tbody tr', function() { sender.select_person(sender.recipient_table.row(this), 'recipient') })

            jQuery('.date-box').change(function() {
                sender.date_filter_button.addClass('pulse')
            })
            sender.date_filter_button.click(function() {
                sender.date_range.apply = true
                sender.date_filter_button.removeClass('pulse')
                sender.render_result_page()
            })

            jQuery('.nav-link').click(function() {
                let tab = jQuery(this)
                let pane = jQuery(tab.data('target'))

                jQuery('.nav-link').removeClass('active')
                tab.addClass('active')
                jQuery('.tab-pane').removeClass('active').removeClass('show')
                pane.addClass('active').addClass('show')
            })

            sender.search_box.keyup(function(e) {
                if (e.key === 'Enter') {
                    sender.render_result_page()
                }
            })
            sender.search_button.click(function() {
                sender.render_result_page()
            })

            sender.content_checkboxes.change(function() {
                sender.render_result_page('letters', true)
            })

            sender.clear_filters_button.click(function() {
                sender.content_checkboxes.prop('checked', true)
                sender.date_range.apply = false
                sender.from_year_box.val('')
                sender.from_month_box.val('')
                sender.from_day_box.val('')
                sender.to_year_box.val('')
                sender.to_month_box.val('')
                sender.to_day_box.val('')
                delete sender.criteria.letters['f_sender.id']
                delete sender.criteria.letters['f_recipient.id']
                jQuery('table.filtered').removeClass('filtered')
                sender.render_result_page('letters', true)
            })

            sender.sort_box.change(function() {
                if (sender.sort_box.val() === 'rel') delete sender.criteria.letters['s_date']
                else sender.criteria.letters['s_date'] = sender.sort_box.val()
                sender.render_result_page('letters', true)
            })

            sender.result_watcher = new IntersectionObserver(function(entries) {
                entries.map(entry => {
                    if (entry.isIntersecting) {
                        let result = jQuery(entry.target)
                        let result_num = parseInt(result.data('result'))
                        let result_type = result.data('type')

                        // update count
                        let current_result_label = jQuery(`#adv-search-${result_type}-current-result`)
                        current_result_label.html(result_num.toLocaleString())

                        if (sender.page_thresholds[result_type] && result_num >= sender.page_thresholds[result_type]) {
                            sender.page_thresholds[result_type] = 0
                            sender.criteria[result_type].page += 1
                            sender.render_result_page(result_type)
                        }
                    }
                })
            })

            sender.clo.make_request(
                `/api/corpus/${sender.clo.corpus_id}/LetterVolume/`,
                'GET',
                { 'page-size': 100, 'only': 'volume_no,front_matters.id' },
                function(vol_data) {
                    if (vol_data.records) {
                        vol_data.records.forEach(vol => {
                            vol.front_matters.forEach(fm => {
                                sender.frontmatter_volume_map[fm.id] = vol.volume_no
                            })
                        })
                    }

                    if (sender.query) {
                        sender.search_box.val(sender.query)
                        delete sender.criteria.letters.s_date
                    } else {
                        sender.sort_box.val('asc')
                    }

                    sender.render_result_page()
                }
            )
        })
    }

    build_criteria() {
        if (this.search_box.val()) {
            let q = this.search_box.val()
            let letter_contents = []
            let param_prefixes = ['1_', 't_', 'p_', 'q']

            // remove existing criteria
            for (let crit in this.criteria) {
                let params = Object.keys(this.criteria[crit]).map(k => k)
                params.forEach(p => {
                    param_prefixes.forEach(prefix => {
                        if (p.startsWith(prefix)) {
                            delete this.criteria[crit][p]
                        }
                    })
                })
            }

            // see which letter fields are enabled
            jQuery('.adv-search-content-checkbox').each(function() {
                let content_box = jQuery(this)
                if (content_box.is(':checked')) letter_contents.push(content_box.data('field'))
            })
            // if all letter fields enabled, use general query
            if (letter_contents.length === 3) {
                Object.assign(this.criteria.letters, {
                    q: q
                })
            // else, query desired fields individually
            } else {
                let group_prefix = ''
                if (letter_contents.length > 1) {
                    this.criteria.letters['1_operator'] = 'or'
                    group_prefix = '1_'
                }
                letter_contents.forEach(field => {
                    this.criteria.letters[`${group_prefix}t_${field}`] = q
                    this.criteria.letters[`${group_prefix}p_${field}`] = q
                })
            }

            // use general query for frontmatter and photos
            Object.assign(this.criteria.frontmatter, {
                q: q
            })
            Object.assign(this.criteria.photos, {
                q: q
            })
        } else {
            this.criteria.letters['q'] = '*'
            this.criteria.frontmatter['q'] = '*'
            this.criteria.photos['q'] = '*'
        }

        //DATES
        if (this.date_range.apply) {
            let from_year = this.from_year_box.val() ? this.from_year_box.val() : this.date_range.min.year
            let from_month = this.from_month_box.val() ? this.from_month_box.val() : this.date_range.min.month
            let from_day = this.from_day_box.val() ? this.from_day_box.val() : this.date_range.min.day
            let to_year = this.to_year_box.val() ? this.to_year_box.val() : this.date_range.max.year
            let to_month = this.to_month_box.val() ? this.to_month_box.val() : this.date_range.max.month
            let to_day = this.to_day_box.val() ? this.to_day_box.val() : this.date_range.max.day

            let from_date = `${from_year}-${from_month}-${from_day}`
            let to_date = `${to_year}-${to_month}-${to_day}`

            if (!isNaN(new Date(from_date)) && !isNaN(new Date(to_date))) {
                this.criteria.letters['r_date'] = `${from_date}to${to_date}`
            }
        }
        console.log(this.criteria)
    }

    populate_people_table(interlocutor_type, table, people_agg) {
        let people = Object.keys(people_agg).map(p => p.split('|||'))
        people.sort(function(a, b) {
            if (a[0] < b[0]) return -1
            else if (a[0] > b[0]) return 1
            return 0
        })
        people = people.map(p => [this.clo.title_case(p[0]), p[1]])
        table.clear()
        table.rows.add(people).draw()
        jQuery('.dt-scroll-body').each(function() {
            let table_body = jQuery(this)
            table_body.css('height','unset')
        })

        if (table.rows().count() <  4) {
            jQuery(`#adv-search-${interlocutor_type}-table_wrapper .dt-search`).hide()
            if (`f_${interlocutor_type}.id` in this.criteria.letters && table.rows().count() === 1) {
                jQuery(`#adv-search-${interlocutor_type}-table_wrapper table`).addClass('filtered')
            }
        }
    }

    select_person(person_row, interlocutor_type) {
        let param = `f_${interlocutor_type}.id`

        if (param in this.criteria.letters) {
            delete this.criteria.letters[param]
            jQuery(`#adv-search-${interlocutor_type}-table_wrapper table`).removeClass('filtered')
        } else {
            let person_id = person_row.data()[1]
            this.criteria.letters[param] = person_id
        }
        this.render_result_page('letters', true)
    }

    set_date_range(min, max) {
        this.date_range.min.year = min.getUTCFullYear()
        this.date_range.min.month = min.getUTCMonth() + 1
        this.date_range.min.day = min.getUTCDate()
        this.date_range.max.year = max.getUTCFullYear()
        this.date_range.max.month = max.getUTCMonth() + 1
        this.date_range.max.day = max.getUTCDate()

        this.from_year_box.val(this.date_range.min.year)
        this.from_month_box.val(this.date_range.min.month)
        this.from_day_box.val(this.date_range.min.day)
        this.to_year_box.val(this.date_range.max.year)
        this.to_month_box.val(this.date_range.max.month)
        this.to_day_box.val(this.date_range.max.day)
    }

    build_excerpts(fragments, highlights) {
        let excerpt_fragments = fragments.map(frag => {
            let highlight_match = frag.match(/<em>([^<]*)<\/em>/)
            if (highlight_match && !highlights.includes(highlight_match[1])) highlights.push(highlight_match[1])
            return this.clean_search_highlight(frag)
        })
        return excerpt_fragments.join(' ... ')
    }

    render_result_page(only=null, reset=false) {
        if (!only) {
            this.letter_results_pane.empty()
            this.frontmatter_results_pane.empty()
            this.photo_results_pane.empty()
            this.criteria.letters.page = 1
            this.criteria.frontmatter.page = 1
        } else if (reset) {
            this.criteria[only].page = 1
            if (only === 'letters') this.letter_results_pane.empty()
            else if (only === 'frontmatter') this.frontmatter_results_pane.empty()
            else if (only === 'photos') this.photo_results_pane.empty()
        }

        this.build_criteria()

        let sender = this

        // POPULATE LETTER RESULTS
        if (!only || only === 'letters') {
            sender.clo.make_request(
                `/api/corpus/${sender.clo.corpus_id}/Letter/`,
                'GET',
                sender.criteria.letters,
                function(results) {
                    if (results.hasOwnProperty('records') && results.records.length) {
                        if (results.meta && results.meta.aggregations) {
                            let aggs = results.meta.aggregations

                            if ('senders' in aggs) {
                                sender.populate_people_table('sender', sender.sender_table, aggs.senders)
                            }
                            if ('recipients' in aggs) {
                                sender.populate_people_table('recipient', sender.recipient_table, aggs.recipients)
                            }
                            if (('mindate' in aggs) && ('maxdate' in aggs)) {
                                sender.set_date_range(
                                    new Date(aggs.mindate),
                                    new Date(aggs.maxdate)
                                )
                            }
                        }

                        let page = results.meta.page
                        let page_size = results.meta.page_size
                        sender.page_thresholds.letters = results.meta.has_next_page ? parseInt(((page - 1) * page_size) + ((page_size / 3) * 2)) : 0
                        sender.letter_total_results_labels.html(results.meta.total.toLocaleString())


                        results.records.map((result, result_index) => {
                            let letter_excerpt = ""
                            let footnote_excerpt = ""
                            let sourcenote_excerpt = ""
                            let full_excerpt = ""
                            let highlights = []
                            if (result.hasOwnProperty('_search_highlights')) {
                                if (result._search_highlights.hasOwnProperty('html')) {
                                    letter_excerpt = sender.build_excerpts(result._search_highlights.html, highlights)
                                }

                                if (result._search_highlights.hasOwnProperty('footnotes')) {
                                    footnote_excerpt = sender.build_excerpts(result._search_highlights.footnotes, highlights)
                                }

                                if (result._search_highlights.hasOwnProperty('sourcenote')) {
                                    sourcenote_excerpt = sender.build_excerpts(result._search_highlights.sourcenote, highlights)
                                }
                            }

                            if (letter_excerpt) full_excerpt += `<div class="clo-search-result-excerpt"><b>Letter Excerpt:</b> ${letter_excerpt}</div>`
                            if (footnote_excerpt) {
                                full_excerpt += `<div class="clo-search-result-excerpt"><b>Footnote Excerpt:</b> ${footnote_excerpt}</div>`
                            }
                            if (sourcenote_excerpt) {
                                full_excerpt += `<div class="clo-search-result-excerpt"><b>Source Note Excerpt:</b> ${sourcenote_excerpt}</div>`
                            }

                            sender.letter_results_pane.append(`
                                <div class="clo-search-result" data-result="${((page - 1) * page_size) + result_index + 1}" data-type="letters">
                                  <div class="clo-search-result-heading">
                                    <a href="/volume/${result.vol_no}/${result.doi}${highlights.length ? `?highlight=${highlights.join('__')}` : ''}" target="_blank">
                                      From ${result.sender.label} to ${result.recipient.label} on ${result.date_label}
                                    </a>
                                  </div>
                                  ${full_excerpt}
                                  <div class="clo-search-result-metadata">
                                    <b>Volume:</b> ${result.vol_no} | <b>DOI:</b> ${result.doi}
                                  </div>
                                </div>
                            `)
                        })

                        sender.watch_results()
                    } else {
                        sender.letter_results_pane.append(`<div class="alert alert-info">No results found.</div>`)
                        sender.letter_total_results_labels.html(0)
                    }
                }
            )
        }

        // POPULATE FRONTMATER RESULTS
        if (!only || only === 'frontmatter') {
            sender.clo.make_request(
                `/api/corpus/${sender.clo.corpus_id}/FrontMatter/`,
                'GET',
                sender.criteria.frontmatter,
                function (results) {
                    if (results.hasOwnProperty('records') && results.records.length) {
                        let page = results.meta.page
                        let page_size = results.meta.page_size
                        sender.page_thresholds.frontmatter = parseInt(((page - 1) * page_size) + ((page_size / 3) * 2))
                        sender.frontmatter_total_results_labels.html(results.meta.total.toLocaleString())

                        results.records.map((result, result_index) => {
                            let matter_excerpt = ""
                            let footnote_excerpt = ""
                            let full_excerpt = ""
                            let highlights = []

                            if (result.id in sender.frontmatter_volume_map) {
                                let vol_no = sender.frontmatter_volume_map[result.id]

                                if (result.hasOwnProperty('_search_highlights')) {
                                    if (result._search_highlights.hasOwnProperty('html')) {
                                        matter_excerpt = sender.build_excerpts(result._search_highlights.html, highlights)
                                    }

                                    if (result._search_highlights.hasOwnProperty('footnotes')) {
                                        footnote_excerpt = sender.build_excerpts(result._search_highlights.footnotes, highlights)
                                    }
                                }

                                if (matter_excerpt) full_excerpt += `<div class="clo-search-result-excerpt"><b>Front Matter Excerpt:</b> ${matter_excerpt}</div>`
                                if (footnote_excerpt) {
                                    full_excerpt += `<div class="clo-search-result-excerpt"><b>Footnote Excerpt:</b> ${footnote_excerpt}</div>`
                                }

                                sender.frontmatter_results_pane.append(`
                                    <div class="clo-search-result" data-id="${result.id}" data-result="${((page - 1) * page_size) + result_index + 1}" data-type="frontmatter">
                                      <div class="clo-search-result-heading">
                                        <a href="/volume/${vol_no}/${result.slug}${highlights.length ? `?highlight=${highlights.join('|||')}` : ''}" target="_blank">
                                          ${result.title} (Volume ${vol_no})
                                        </a>
                                      </div>
                                      ${full_excerpt}
                                    </div>
                                `)
                            }
                        })

                        sender.watch_results()
                    } else {
                        sender.frontmatter_results_pane.append(`<div class="alert alert-info">No results found.</div>`)
                        sender.frontmatter_total_results_labels.html(0)
                    }
                }
            )
        }

        // POPULATE PHOTO RESULTS
        if (!only || only === 'photos') {
            sender.clo.make_request(
                `/api/corpus/${sender.clo.corpus_id}/Photo/`,
                'GET',
                sender.criteria.photos,
                function (results) {
                    if (results.hasOwnProperty('records') && results.records.length) {
                        sender.photo_total_results_labels.html(results.meta.total.toLocaleString())
                        let album = {photos: results.records}
                        let album_viewer = new AlbumViewer(sender.clo, sender.photo_results_pane, album)
                    } else {
                        sender.photo_results_pane.append(`<div class="alert alert-info">No results found.</div>`)
                        sender.photo_total_results_labels.html(0)
                    }
                }
            )
        }
    }

    watch_results() {
        let sender = this
        jQuery('.clo-search-result:not([data-observed])').each(function() {
            let l = jQuery(this)
            sender.result_watcher.observe(l[0])
            l.data('observed', true)
        })
    }

    clean_search_highlight(frag) {
        let fixed_frag = frag.replace('<em>', '|||+').replace('</em>', '+|||')
        let open_tag_count = (frag.match(/</g) || []).length
        let close_tag_count = (frag.match(/>/g) || []).length
        if (open_tag_count > close_tag_count) fixed_frag = fixed_frag + '>'
        else if (close_tag_count > open_tag_count) fixed_frag = '<' + fixed_frag
        fixed_frag = fixed_frag.replace(/(<([^>]+)>)/gi, "")
        return fixed_frag.replace('|||+', '<mark class="clo-letter-highlight">').replace('+|||', '</mark>')
    }
}
