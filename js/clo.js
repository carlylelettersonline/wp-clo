class CarlyleLettersOnline {
    constructor(corpora_host, corpora_token, clo_corpus_id) {
        this.host = corpora_host;
        this.token = corpora_token;
        this.corpus_id = clo_corpus_id;
        this.site_header = null;
        this.volume_batch_widget = null;
        this.volume_viewer_widget = null;
        this.photo_album_widget = null;
        this.album_viewer_widget = null;

        // rig up the site header
        let clo_site_header = jQuery('#clo-header-div');
        if (clo_site_header.length) {
            this.site_header = new SiteHeader(this, clo_site_header);
        }

        // rig up volume batches
        let clo_volume_batch_div = jQuery('#clo-volume-batch-div');
        if (clo_volume_batch_div.length) {
            this.volume_batch_widget = new VolumeBatch(this, clo_volume_batch_div);
        }

        // rig up volume viewer
        let clo_volume_navigator_div = jQuery('#clo-volume-navigator-div');
        let clo_letter_viewer_div = jQuery('#clo-letter-viewer-div');
        if (clo_volume_navigator_div.length && clo_letter_viewer_div) {
            this.volume_viewer_widget = new VolumeViewer(this, clo_volume_navigator_div, clo_letter_viewer_div);
        }

        // rig up photo albums
        let clo_photo_album_div = jQuery('#clo-photo-album-div');
        if (clo_photo_album_div.length) {
            this.photo_album_widget = new PhotoAlbum(this, clo_photo_album_div);
        }

        // rig up album viewer
        let clo_album_viewer_div = jQuery('#clo-album-viewer-div');
        if (clo_album_viewer_div.length) {
            this.album_viewer_widget = new AlbumViewer(this, clo_album_viewer_div);
        }
    }

    make_request(path, type, params={}, callback, inject_host=true) {
        let url = path;
        if (inject_host) url = `${this.host}${path}`;

        let req = {
            type: type,
            url: url,
            dataType: 'json',
            crossDomain: true,
            data: params,
            success: callback
        };

        if (this.token) {
            let sender = this;
            req['beforeSend'] = function(xhr) { xhr.setRequestHeader("Authorization", `Token ${sender.token}`) };
        }

        return jQuery.ajax(req);
    }
}

class SiteHeader {
    constructor(clo_instance, element) {
        this.clo = clo_instance;
        this.element = element;

        this.element.append(`
            <img id="clo-header-image" src="/wp-content/plugins/clo/img/clo-header.png" alt="The Carlyle Letters Online" border="0" />
            <div id="clo-nav-div" class="d-flex justify-content-center">
              <div id="clo-nav-links-div" class="d-flex justify-content-around align-items-center p-2">
                <a href="/">Home</a>
                <a href="/browse-volume">Browse by Date and/or Volume</a>
                <a href="/rubenstein">Rubenstein Collection</a>
                <a href="/photo-album">Carlyle Photograph Albums</a>
              </div>
            </div>
        `);
    }
}

class VolumeBatch {
    constructor(clo_instance, element) {
        this.clo = clo_instance;
        this.element = element;

        let sender = this;

        sender.element.append(`
            <h4 class="orange-border-bottom">Browse by Date and/or Volume</h4>
        `);

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/VolumeBatch/`,
            'GET',
            {'s_order': 'asc', 'page-size': 50},
            function (data) {
                if (data.hasOwnProperty('records')) {
                    let html = '';

                    data.records.map((record, record_index) => {
                        let min_vol_no = record.volumes[0].volume_no;
                        let max_vol_no = record.volumes[record.volumes.length - 1].volume_no;
                        let vol_links = record.volumes.map(vol => `<a href="/volume/${vol.volume_no}/frontispiece" class="clo-volume-link">${vol.label}: ${vol.description}</a>`);
                        let before = `<div class="row"><div class="col-sm-6">`;
                        let after = `</div>`;

                        if (record_index % 2 !== 0) {
                            before = `<div class="col-sm-6">`;
                            after = `</div></div>`;
                        }

                        html += `
                            ${before}
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
                            ${after}
                        `;
                    });

                    sender.element.append(html);
                }
            }
        );
    }
}

class VolumeViewer {
    constructor(clo_instance, nav_element, viewer_element) {
        this.clo = clo_instance;
        this.nav_element = nav_element;
        this.viewer_element = viewer_element;
        this.volume = null;
        this.letter = null;
        this.max_vol_no = null;
        this.all_letter_dois = [];
        this.front_slug_id_map = {};

        // check for url path parameters
        let path_parts = window.location.pathname.split('/');
        if (path_parts.length === 5) {
            this.volume = path_parts[2];
            this.letter = path_parts[3];

            if (!isNaN(this.volume)) {
                this.volume = parseInt(this.volume);
            }
        }

        let sender = this;
        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/LetterVolume/`,
            'GET',
            {'f_volume_no': sender.volume, 'only': 'id'},
            function (data) {
                if (data.hasOwnProperty('records') && data.records.length === 1) {
                    let volume_id = data.records[0].id;
                    sender.clo.make_request(
                        `/api/corpus/${sender.clo.corpus_id}/LetterVolume/`,
                        'GET',
                        {
                            f_id: volume_id,
                            only: 'label,description,front_matters.id,front_matters.label,front_matters.slug,letters.id,letters.date,letters.label,letters.description,letters.doi'
                        },
                        function (vol_data) {
                            if (vol_data.hasOwnProperty('records') && vol_data.records.length === 1) {
                                let vol = vol_data.records[0];
                                let front_matters = vol.front_matters.map(front_matter => {
                                    let label = front_matter.label;
                                    let start_tag_index = label.indexOf('&lt;');
                                    if (start_tag_index > -1)
                                        label = label.substring(0, start_tag_index);

                                    sender.front_slug_id_map[front_matter.slug] = front_matter.id;

                                    return `<div class="clo-vol-front-matter-div">
                                        <a class="clo-vol-front-matter-link clo-vol-nav-link"
                                                data-text-type="FrontMatter"
                                                data-slug="${front_matter.slug}"
                                                data-id="${front_matter.id}">
                                            ${label}
                                        </a>
                                     </div>`;
                                });

                                let letters = '<details><summary>LETTERS</summary>';
                                let month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                let last_month = '';

                                vol.letters.map(letter => {
                                    if (letter.date) {
                                        let d = new Date(Date.parse(letter.date));
                                        let month_label = `${month_names[d.getMonth()]} ${d.getFullYear()}`;

                                        if (month_label !== last_month) {
                                            if (last_month) {
                                                letters += '</details>';
                                            }
                                            letters += `<details><summary>${month_label}</summary>`;
                                            last_month = month_label;
                                        }

                                        letters += `
                                            <div class="clo-vol-letter-link-div">
                                                <a class="clo-vol-letter-link clo-vol-nav-link" data-text-type="Letter" data-id="${letter.id}">
                                                    <span class="clo-vol-letter-link-date">${letter.label}</span><br />
                                                    <span class="clo-vol-letter-link-desc">${letter.description}</span>
                                                </a>
                                            </div>
                                        `;

                                        sender.all_letter_dois.push(letter.doi);
                                    }
                                });
                                letters += `</details></details>`;

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
                                `);

                                if (!sender.max_vol_no) {
                                    sender.clo.make_request(
                                        `/api/corpus/${sender.clo.corpus_id}/LetterVolume/`,
                                        'GET',
                                        {'a_max_volno': 'volume_no', 'page-size': 0},
                                        function (data) {
                                            if (data.hasOwnProperty('meta') && data.meta.hasOwnProperty('aggregations') && data.meta.aggregations.hasOwnProperty('volno')) {
                                                sender.max_vol_no = parseInt(data.meta.aggregations.volno);
                                                sender.fix_navigation();
                                            }
                                        }
                                    );
                                }

                                if (sender.letter === 'frontispiece') {
                                    sender.clo.make_request(
                                        `/api/corpus/${sender.clo.corpus_id}/Photo/`,
                                        'GET',
                                        {'f_frontispiece_volume.id': volume_id, 'only': 'iiif_url,description'},
                                        function (frontis) {
                                            sender.viewer_element.append(`
                                    <div class="clo-letter-frontispiece-div">
                                        <img src="${frontis.records[0].iiif_url}/full/full/0/default.jpg" />
                                        <div class="clo-letter-frontispiece-caption">${frontis.records[0].description}</div>
                                    </div>
                                `);
                                        }
                                    );
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
                                                sender.render_content('Letter', data.records[0].id);
                                            }
                                        }
                                    )
                                } else if (sender.letter in sender.front_slug_id_map) {
                                    sender.render_content('FrontMatter', sender.front_slug_id_map[sender.letter]);
                                }
                            }
                        }
                    );
                }
            }
        );
    }

    fix_navigation() {
        let sender = this;

        if (this.max_vol_no) {
            if (this.volume < 2) jQuery('#clo-vol-prev').hide();
            if (this.volume >= this.max_vol_no) jQuery('#clo-vol-next').hide();
        } else if (this.all_letter_dois.includes(this.letter)) {
            let letter_index = this.all_letter_dois.indexOf(this.letter);
            let prev_btns = jQuery('.clo-letter-nav-link.prev');
            let next_btns = jQuery('.clo-letter-nav-link.next');

            letter_index > 0 ? prev_btns.show() : prev_btns.hide();
            letter_index === this.all_letter_dois.length - 1 ? next_btns.hide() : next_btns.show();
        }

        // volume navigation
        jQuery('.vol-nav-link').click(function() {
            let direction = jQuery(this).data('direction');

            if (direction === 'prev' && sender.volume > 1) window.location.href = `/volume/${sender.volume - 1}/frontispiece`;
            else if (direction === 'next' && sender.volume < sender.max_vol_no) window.location.href = `/volume/${sender.volume + 1}/frontispiece`;
        });

        // TOC navigation
        jQuery('.clo-vol-nav-link').click(function() {
            let link = jQuery(this);
            sender.render_content(link.data('text-type'), link.data('id'));
            sender.clo.site_header.element[0].scrollIntoView();
        });

        // letter navigation
        jQuery('.clo-letter-nav-link').click(function() {
            let link = jQuery(this);
            let letter_doi_index = sender.all_letter_dois.indexOf(sender.letter);
            if (link.hasClass('prev') && letter_doi_index > 0) {
                window.location.href = `/volume/${sender.volume}/${sender.all_letter_dois[letter_doi_index - 1]}`;
            } else if (link.hasClass('next') && letter_doi_index < sender.all_letter_dois.length - 1) {
                window.location.href = `/volume/${sender.volume}/${sender.all_letter_dois[letter_doi_index + 1]}`;
            }
        });

        // footnote navigation
        jQuery('.footnote').click(function() {
            let link = jQuery(this);
            let note_no = link.data('note_number');

            if (link.hasClass('origin')) {
                let footnotes = jQuery('#clo-letter-footnotes-div');
                if (!footnotes.is('[open]')) {
                    footnotes.attr('open', true);
                }
                let target_note = jQuery(`a.footnote.target[data-note_number=${note_no}]`);
                if (target_note.length) {
                    target_note[0].scrollIntoView();
                }
            } else if (link.hasClass('target')) {
                let origin_note = jQuery(`sup.footnote.origin[data-note_number=${note_no}]`);
                if (origin_note.length) {
                    origin_note[0].scrollIntoView();
                }
            }
        });
    }

    render_content(content_type, content_id, slug=null) {
        let sender = this;

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/${content_type}/${content_id}/`,
            'GET',
            {},
            function (content) {
                if (content.hasOwnProperty('content_type')) {
                    sender.viewer_element.empty();

                    // build footnotes div if necessary
                    let footnotes_div = '';
                    if (content.hasOwnProperty('footnotes') && content.footnotes.length) {
                        footnotes_div = `
                            <details id="clo-letter-footnotes-div">
                                <summary>Footnotes</summary>
                                <div class="clo-note-div">
                        `;

                        content.footnotes.map((note, index) => {
                            footnotes_div += `<p><a class="footnote target" data-note_number="${index + 1}">${index + 1}</a>${note}</p>\n`;
                        });

                        footnotes_div += `
                                </div>
                            </details>`;
                    }

                    // render front matter
                    if (content.content_type === 'FrontMatter') {
                        history.replaceState(null, content.title, `/volume/${sender.volume}/${content.slug}`);
                        sender.viewer_element.html(`
                            <div id="clo-letter-content-div">
                                <b class="ml-auto mr-auto mb-2">${content.title}</b>
                                ${content.html}
                            </div>
                            
                            ${footnotes_div}
                        `);

                    // render letter
                    } else if (content.content_type === 'Letter') {
                        history.replaceState(null, content.date_label, `/volume/${sender.volume}/${content.doi}`);
                        let letter_nav = `
                            <div class="clo-letter-nav-div">
                              <a class="clo-letter-nav-link prev">&lt; PREVIOUS</a>
                              <a class="clo-letter-nav-link next">NEXT &gt;</a>
                            </div>
                        `;

                        let content_div = `
                            <div id="clo-letter-content-div">
                              <p>${content.description}; ${content.date_label}; DOI 10.1215/${content.doi}</p>
                              <p><b>${content.description}</b></p>
                              ${content.html}
                            </div>
                        `;

                        let sourcenote_div = `
                            <details id="clo-letter-sourcenote-div">
                                <summary>Sourcenote</summary>
                                <div class="clo-note-div">
                                    ${content.sourcenote}
                                </div>
                            </details>
                        `;

                        if (content.hasOwnProperty('page_images') && content.page_images.length) {
                            sender.viewer_element.html(`
                                <div class="row">
                                  <div class="col-sm-8">
                                    <div id="clo-letter-image-viewer"></div>
                                  </div>
                                  
                                  <div class="col-sm-4">
                                    ${letter_nav}
                                    ${content_div}
                                    ${sourcenote_div}
                                    ${footnotes_div}
                                    ${letter_nav}
                                  </div>
                                </div>
                            `);

                            let dragon = OpenSeadragon({
                                id:                 "clo-letter-image-viewer",
                                prefixUrl:          "/wp-content/plugins/clo/js/openseadragon/images/",
                                preserveViewport:   false,
                                visibilityRatio:    1,
                                minZoomLevel:       .25,
                                maxZoomLevel:       5,
                                defaultZoomLevel:   1,
                                homeFillsViewer:    true,
                                showRotationControl: true,
                                tileSources:   [content.page_images],
                                sequenceMode: true,
                                showReferenceStrip: true,
                                referenceStripScroll: 'horizontal',
                            });

                        } else {
                            sender.viewer_element.html(`
                                ${letter_nav}
                                ${content_div}
                                ${sourcenote_div}
                                ${footnotes_div}
                                ${letter_nav}
                            `);
                        }
                    }

                    sender.fix_navigation();
                }
            }
        );
    }
}

class PhotoAlbum {
    constructor(clo_instance, element) {
        this.clo = clo_instance;
        this.element = element;

        let sender = this;

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/PhotoAlbum/`,
            'GET',
            {'only': 'title,album_no,description'},
            function (albums) {
                if (albums.hasOwnProperty('records') && albums.records.length) {
                    let html = '<div class="container mt-5"><div class="row"><div class="col-sm-6">';

                    albums.records.map((album, index) => {
                        html += `
                            <div class="pl-4">
                              <a class="clo-bold-orange" href="/album-viewer/${album.album_no}">${album.title}</a>
                              <p>${album.description}</p>
                            </div>
                        `;

                        if (index === 3) html += '</div><div class="col-sm-6">';
                    });
                    html += '</div></div></div>'
                    sender.element.html(html);
                }
            }
        );
    }
}

class AlbumViewer {
    constructor(clo_instance, element) {
        this.clo = clo_instance;
        this.element = element;
        this.max_photo_width = 300;
        this.all_album_photos = [];
        this.month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.album_no = null;
        this.photo_no = -1;
        let sender = this;

        this.photo_observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    sender.show_image(entry.target, sender.max_photo_width);
                }
            })
        }, { threshold: [0] });

        // determine album and optional photo numbers
        let path_parts = window.location.pathname.split('/');
        if (path_parts.length >= 4) {
            this.album_no = path_parts[2];
            if (!isNaN(this.album_no)) {
                this.album_no = parseInt(this.album_no);
            }
        }
        if (path_parts.length === 5) {
            this.photo_no = path_parts[3];
            if (!isNaN(this.photo_no)) {
                this.photo_no = parseInt(this.photo_no);
            }
        }

        this.show_album();

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
        `);
    }

    show_album() {
        let sender = this;
        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/PhotoAlbum/`,
            'GET',
            {'f_album_no': sender.album_no},
            function(album) {
                if (album.hasOwnProperty('records') && album.records.length === 1) {
                    album = album.records[0];
                    let html = `
                      <div class="container">
                        <h2 id="clo-album-viewer-title" class="orange-border-bottom" data-album_title="${album.title}">${album.title}</h2>
                        <div class="d-flex justify-content-center">
                          <div id="clo-album-viewer" class="w-100">
                    `;

                    album.photos.map((photo, index) => {
                        html += `
                          <div class="clo-album-cell">
                            <div class="clo-album-cell-matte">
                              <div class="clo-album-cell-inner">
                                <div class="clo-album-tooltiptext" tabindex="${index}">${photo.title}</div>
                                <img id="clo-album-photo-${photo.id}"
                                     class="clo-album-photo"
                                     src="/wp-content/plugins/clo/img/placeholder-image.jpeg"
                                     data-iiif_url="${photo.iiif_url}"
                                     data-photo_no="${index}"
                                >
                              </div>
                            </div>
                          </div>
                        `;

                        sender.all_album_photos.push(photo);
                    });

                    html += `
                            <
                         </div>
                        </div>
                      </div>
                    `;

                    sender.element.html(html);
                    let album_photos = jQuery('.clo-album-photo');
                    let album_viewer = jQuery('#clo-album-viewer');

                    album_photos.each(function() {
                        sender.photo_observer.observe(this);
                    });

                    album_photos.click(function() {
                        sender.feature_image(parseInt(jQuery(this).data('photo_no')));
                    });

                    if (sender.photo_no > -1 && sender.photo_no < sender.all_album_photos.length)
                        sender.feature_image(sender.photo_no);
                }
            }
        );
    }

    feature_image(photo_no) {
        let photo_info = this.all_album_photos[photo_no];
        let photo_modal = jQuery('#clo-album-feature-modal');
        let photo_modal_label = jQuery('#clo-album-feature-modal-label');
        let photo_modal_body = jQuery('#clo-album-feature-modal-body');
        let photo_modal_image = jQuery('#clo-album-feature-image');
        let photo_modal_footer = jQuery('#clo-album-feature-modal-footer');
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
        ];

        photo_modal_label.html(photo_info.title);

        let metadata = `<table border="0" width="100%">`;
        metadata_fields.map(f => {
            if (photo_info.hasOwnProperty(f.field) && ((f.multi && photo_info[f.field].length) || (!f.multi && photo_info[f.field]))) {
                let val = photo_info[f.field];
                if (f.multi) {
                    val = val.join('; ');
                } else if (f.field === 'date_taken') {
                    let d = new Date(Date.parse(val));
                    val = `${this.month_names[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
                }

                metadata += `
                    <tr>
                      <td class="clo-album-metadata-label" valign="top" align="right">${f.label}:</td>
                      <td class="clo-album-metadata-value" valign="top" align="left">${val}</td>
                    </tr>
                `;
            }
        });
        metadata += `</table>`;
        photo_modal_footer.html(metadata);
        photo_modal_image.empty();

        photo_modal.off('shown.bs.modal').on('shown.bs.modal', function() {
            photo_modal_image.css('height', `${photo_modal_body.height() - 10}px`);
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
            });
        });

        photo_modal_footer.off('mouseover').on('mouseover', function() {
            photo_modal_image.css('height', `${photo_modal_body.height() - 110}px`);
        });
        photo_modal_footer.off('mouseout').on('mouseout', function() {
            photo_modal_image.css('height', `${photo_modal_body.height() - 10}px`);
        });

        photo_modal.modal();
    }

    show_image(el, max_photo_width) {
        let img = jQuery(el);
        if (!img.is('[rendered]')) {
            let sender = this;
            let iiif_url = img.data('iiif_url');

            sender.clo.make_request(
                iiif_url,
                'GET',
                {},
                function(info) {
                    if (info.hasOwnProperty('width')) {
                        let max_width = info.width;
                        if (max_width > max_photo_width) {
                            max_width = max_photo_width;
                        }

                        iiif_url = `${iiif_url}/full/${max_width},/0/default.jpg`;
                        img.attr('src', iiif_url);
                        img.attr('rendered', true);

                        let photo_no = parseInt(img.data('photo_no'));
                        sender.all_album_photos[photo_no].max_width = info.width;
                        sender.all_album_photos[photo_no].max_height = info.height;
                    }
                },
                false
            );
        }
    }
}