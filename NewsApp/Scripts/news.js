var _pageIndex = 0;
var _pageSize = 10;

var _newsList = null;
var _likesList = null;
var _commentsList = null;


function getQueryStringParam(paramName) {
    var query = document.URL.split('?')[1];

    if (typeof (query) != "undefined") {
        query = query.split("&");

        for (var i = 0; i < query.length; i++) {
            var param = query[i].split("=");

            if (param[0].toUpperCase() == paramName.toUpperCase() && param.length > 1) {
                return param[1];
            }
        }
    }

    return "";
}

function getWebUrl() {
    var webUrl = "";
    var webUrlPosition = document.URL.toUpperCase().indexOf("/NEWSAPP/PAGES/NEWS.ASPX");

    if (webUrlPosition > -1) {
        webUrl = document.URL.substring(0, webUrlPosition);
    }

    return webUrl;
}

function loadDefaultStyles(callback) {
    var webUrl = getWebUrl();

    var ctagParameter = "";
    var ctagValue = decodeURIComponent(getQueryStringParam("SPClientTag"));

    if (ctagValue.length > 0) {
        ctagParameter = "ctag=" + ctagValue;
    }
    else {
        ctagParameter = "ctag=0";
    }

    var $link = $("<link rel='stylesheet' />");
    $link.attr("href", webUrl + "/_layouts/15/defaultcss.ashx?" + ctagParameter);

    if (typeof (callback) == "function") {
        $link.on("load", function () {
            callback();
        });
    }

    $(document.head).append($link);
}

function getList(spLists, listUrl) {
    var listsEnumerator = spLists.getEnumerator();
    while (listsEnumerator.moveNext()) {
        var spList = listsEnumerator.get_current();
        if (spList.get_defaultViewUrl().toUpperCase().indexOf(listUrl.toUpperCase()) != -1) {
            return spList;
        }
    }

    return null;
}

function resizeWebPart() {
    if (self != top) {
        var senderId = getQueryStringParam("SenderId");
        var width = "100%";
        var height = $(document.body).height();

        var message = "<Message senderId=" + senderId + " >" + "resize(" + width + "," + height + ")</Message>";
        window.parent.postMessage(message, "*");
    }
}

function showNews(spContext, collectionPosition) {
    $("#contentDiv").html("<div id='loadingHeader' class='ms-soften'>" + resources.get_loadingHeaderText() + "</div>");

    resizeWebPart();

    var queryXml = "<View>" +
                       "<Query>" +
                           "<Where>" +
                               "<Or>" +
                                   "<Geq>" +
                                       "<FieldRef Name='NewsItemExpiresOn' />" +
                                       "<Value Type='DateTime'><Today /></Value>" +
                                   "</Geq>" +
                                   "<IsNull>" +
                                       "<FieldRef Name='NewsItemExpiresOn' />" +
                                   "</IsNull>" +
                               "</Or>" +
                           "</Where>" +
                           "<OrderBy>" +
                               "<FieldRef Name='ID' />" +
                           "</OrderBy>" +
                       "</Query>" +
                       "<ViewFields>" +
                           "<FieldRef Name='Title' />" +
                           "<FieldRef Name='NewsItemShortPart' />" +
                           "<FieldRef Name='NewsItemAllowLikes' />" +
                           "<FieldRef Name='NewsItemAllowComments' />" +
                           "<FieldRef Name='Created' />" +
                       "</ViewFields>" +
                       "<RowLimit>" + _pageSize + "</RowLimit>" +
                   "</View>";

    var query = new SP.CamlQuery();
    query.set_viewXml(queryXml);
    query.set_listItemCollectionPosition(collectionPosition);

    var newsItems = _newsList.getItems(query);
    spContext.load(newsItems);

    spContext.executeQueryAsync(
    Function.createDelegate(this, function () {
        var newsValues = [];

        var enumerator = newsItems.getEnumerator();
        while (enumerator.moveNext()) {
            var newsItem = enumerator.get_current();

            var newsValue = {
                id: newsItem.get_id(),
                title: newsItem.get_item("Title"),
                shortPart: newsItem.get_item("NewsItemShortPart"),
                allowLikes: newsItem.get_item("NewsItemAllowLikes"),
                allowComments: newsItem.get_item("NewsItemAllowComments"),
                htmlValues: newsItem.get_fieldValuesAsHtml()
            };

            spContext.load(newsValue.htmlValues, "Created");
            newsValues.push(newsValue);
        }

        if (newsValues.length > 0) {
            spContext.executeQueryAsync(
                Function.createDelegate(this, function () {
                    for (var i in newsValues) {
                        var newsValue = newsValues[i];
                        var isLastNews = i == newsValues.length - 1

                        if (isLastNews) {
                            addNewsDiv(spContext, newsValue, isLastNews, function () {
                                addPaging(spContext, newsItems.get_listItemCollectionPosition(), newsValues[0].id, newsValues.length);
                            });
                        }
                        else {
                            addNewsDiv(spContext, newsValue, isLastNews);
                        }
                    }
                }),
                Function.createDelegate(this, function (sender, args) {
                    showErrorMessage(spContext, args.get_message());
                }));
        }
        else {
            $("#contentDiv").html("");

            resizeWebPart();
        }
    }),
    Function.createDelegate(this, function (sender, args) {
        showErrorMessage(spContext, args.get_message());
    }));
}

function addNewsDiv(spContext, newsValue, isLastNews, addPaginCallback) {
    var $newsDiv = $("<div class='newsDiv' style='display: none'></div");
    $("#contentDiv").append($newsDiv);

    var $newsLink = $("<a class='ms-accentText' href='javascript:;'>" + newsValue.title + "</a>");
    $newsLink.attr("onclick", "window.open('" + getWebUrl() + "/NewsApp/Pages/NewsItem.aspx?id=" + newsValue.id + "');");

    var $newsTitleH1 = $("<h1></h1>");
    $newsTitleH1.append($newsLink);

    $newsDiv.append($newsTitleH1);
    $newsDiv.append("<div class='ms-descriptiontext' noWrap='nowrap'>" + newsValue.htmlValues.get_item("Created") + "</div>");
    $newsDiv.append("<div>" + newsValue.shortPart + "</div>");

    if (newsValue.allowLikes || newsValue.allowComments) {
        var $footerDiv = $("<div class='newsFooter'></div>");
        $newsDiv.append($footerDiv);
        $newsDiv.append("<hr class='sectionSeparator' />");

        if (newsValue.allowLikes) {
            addLikesSection(spContext, $footerDiv[0], newsValue, function () {
                if (newsValue.allowComments) {
                    addCommentsSection(spContext, $footerDiv[0], newsValue, function () {
                        if (isLastNews) {
                            showNewsCompleted(addPaginCallback);
                        }
                    });
                }
                else {
                    if (isLastNews) {
                        showNewsCompleted(addPaginCallback);
                    }
                }
            });
        }
        else if (newsValue.allowComments) {
            addCommentsSection(spContext, $footerDiv[0], newsValue, function () {
                if (isLastNews) {
                    showNewsCompleted(addPaginCallback);
                }
            });
        }
    }
    else {
        $newsDiv.append("<hr class='sectionSeparator' />");

        if (isLastNews) {
            showNewsCompleted(addPaginCallback);
        }
    }
}

function showNewsCompleted(addPaginCallback) {
    var $contentDiv = $("#contentDiv");
    $contentDiv.find("#loadingHeader").remove();
    $contentDiv.children(".newsDiv").show();

    if (typeof (addPaginCallback) == "function") {
        addPaginCallback();
    }

    resizeWebPart();
}

function addPaging(spContext, collectionPosition, firstId, itemsCount) {
    var $previousButton;
    if (_pageIndex > 0) {
        var previousCollectionPosition = null;

        if (_pageIndex != 1) {
            previousCollectionPosition = new SP.ListItemCollectionPosition();
            previousCollectionPosition.set_pagingInfo("PagedPrev=TRUE&Paged=TRUE&p_ID=" + firstId);
        }

        var $previousButtonImg = $("<img class='ms-promlink-button-left' border='0' src='/_layouts/15/images/spcommon.png?rev=39' />");
        $previousButtonImg.attr("alt", resources.get_previousButtonImgAlt());

        var $previousButtonSpan = $("<span class='ms-promlink-button-image'></span>");
        $previousButtonSpan.append($previousButtonImg);

        $previousButton = $("<a class='ms-commandLink ms-promlink-button ms-promlink-button-enabled' href='javascript:'></a>");
        $previousButton.attr("title", resources.get_previousButtonTitle());
        $previousButton.append($previousButtonSpan);

        $previousButton.click(function () {
            _pageIndex--;

            showNews(spContext, previousCollectionPosition);
        });
    }

    var $nextButton;
    if (collectionPosition != null) {
        var $nextButtonImg = $("<img class='ms-promlink-button-right' border='0' src='/_layouts/15/images/spcommon.png?rev=39' />");
        $nextButtonImg.attr("alt", resources.get_nextButtonImgAlt());

        var $nextButtonSpan = $("<span class='ms-promlink-button-image'></span>");
        $nextButtonSpan.append($nextButtonImg);

        $nextButton = $("<a class='ms-commandLink ms-promlink-button ms-promlink-button-enabled' href='javascript:'></a>");
        $nextButton.attr("title", resources.get_nextButtonTitle());
        $nextButton.append($nextButtonSpan);

        $nextButton.click(function () {
            _pageIndex++;

            showNews(spContext, collectionPosition);
        });
    }

    if (typeof ($previousButton) != "undefined" || typeof ($nextButton) != "undefined") {
        var $pagingTable = $("<table cellspacing='0' cellpadding='0'><tr><td></td><td></td><td></td></tr</table>");

        if (typeof ($previousButton) != "undefined") {
            $pagingTable.find("td:eq(0)").append($previousButton);
        }

        $pagingTable.find("td:eq(1)").append("<div class='ms-paging'>" + (_pageIndex * _pageSize + 1) + " - " + (_pageIndex * _pageSize + itemsCount) + "</div>");

        if (typeof ($nextButton) != "undefined") {
            $pagingTable.find("td:eq(2)").append($nextButton);
        }

        $("#contentDiv").append($pagingTable);
    }
}

function addLikesSection(spContext, footerDiv, newsValue, callback) {
    loadLikesItems(spContext, newsValue.id, function (myLikesItemsCount, authors) {
        var $likeButtonImg = $("<img class='likeButtonImg' />");

        var $likeButtonSpan = $("<span class='likeButtonSpan'></span>");
        $likeButtonSpan.append($likeButtonImg);

        if (myLikesItemsCount > 0) {
            $likeButtonImg.attr("src", "../Images/RemoveLikeIcon.png");
            $likeButtonImg.attr("alt", resources.get_removeLikeButtonImgAlt());

            $likeButtonSpan.attr("title", resources.get_removeLikeButtonSpanTitle());
        }
        else {
            $likeButtonImg.attr("src", "../Images/AddLikeIcon.png");
            $likeButtonImg.attr("alt", resources.get_addLikeButtonImgAlt());

            $likeButtonSpan.attr("title", resources.get_addLikeButtonSpanTitle());
        }

        var likeInProgress = false;

        $likeButtonSpan.hover(function () {
            if (!likeInProgress) {
                $(this).addClass('ms-strongLines ms-bgSelected');
            }
        },
        function () {
            if (!likeInProgress) {
                $(this).removeClass('ms-strongLines ms-bgSelected');
            }
        });

        $likeButtonSpan.click(function () {
            if (!likeInProgress) {
                likeInProgress = true;

                $likeButtonSpan.removeClass('ms-strongLines ms-bgSelected');
                $likeButtonSpan.css("cursor", "default");
                $likeButtonSpan.removeAttr("title");

                if (myLikesItemsCount > 0) {
                    $likeButtonImg.attr("src", "../Images/RemoveLikeDisabledIcon.png");

                    removeLike(spContext, newsValue.id, null, function () {
                        addLikesSection(spContext, footerDiv, newsValue);
                    });
                }
                else {
                    $likeButtonImg.attr("src", "../Images/AddLikeDisabledIcon.png");

                    addLike(spContext, newsValue.id, function () {
                        addLikesSection(spContext, footerDiv, newsValue);
                    });
                }
            }
        });

        $(footerDiv).find(".likeButtonSpan:first").remove();
        $(footerDiv).prepend($likeButtonSpan);

        if (authors.length > 0) {
            var $likesCountButton = $("<a class='likesCountButton ms-accentText' href='javascript:;'>" + resources.getLikesCountText(authors.length) + "</a>");

            $(footerDiv).find(".likesCountButton:first").remove();
            $likeButtonSpan.after($likesCountButton);

            addLikesCallout($likesCountButton[0], newsValue.id, authors);
        }
        else {
            $(footerDiv).find(".likesCountButton:first").remove();
        }

        if (typeof (callback) == "function") {
            callback();
        }
    });
}

function loadLikesItems(spContext, newsId, callback) {
    var queryXml1 = "<View>" +
                        "<Query>" +
                            "<Where>" +
                                "<And>" +
                                    "<Eq>" +
                                        "<FieldRef Name='LikesItemNews' LookupId='TRUE' />" +
                                        "<Value Type='Lookup'>" + newsId + "</Value>" +
                                    "</Eq>" +
                                    "<Eq>" +
                                        "<FieldRef Name='Author' LookupId='TRUE' />" +
                                        "<Value Type='Lookup'><UserID /></Value>" +
                                    "</Eq>" +
                                "</And>" +
                            "</Where>" +
                        "</Query>" +
                        "<RowLimit>1</RowLimit>" +
                    "</View>";

    var query1 = new SP.CamlQuery();
    query1.set_viewXml(queryXml1);

    var myLikesItems = _likesList.getItems(query1);
    spContext.load(myLikesItems);

    var queryXml2 = "<View>" +
                        "<Query>" +
                            "<Where>" +
                                "<Eq>" +
                                    "<FieldRef Name='LikesItemNews' LookupId='TRUE' />" +
                                    "<Value Type='Lookup'>" + newsId + "</Value>" +
                                "</Eq>" +
                            "</Where>" +
                        "</Query>" +
                        "<ViewFields>" +
                            "<FieldRef Name='Author' />" +
                        "</ViewFields>" +
                        "<RowLimit>106</RowLimit>" +
                    "</View>";

    var query2 = new SP.CamlQuery();
    query2.set_viewXml(queryXml2);

    var likesItems = _likesList.getItems(query2);
    spContext.load(likesItems);

    spContext.executeQueryAsync(
        Function.createDelegate(this, function () {
            var authors = [];

            var enumerator = likesItems.getEnumerator();
            while (enumerator.moveNext()) {
                var likesItem = enumerator.get_current();

                spContext.load(likesItem.get_fieldValuesAsHtml(), "Author");
                authors.push(likesItem.get_fieldValuesAsHtml());
            }

            if (authors.length > 0) {
                spContext.executeQueryAsync(
                    Function.createDelegate(this, function () {
                        if (typeof (callback) == "function") {
                            callback(myLikesItems.get_count(), authors);
                        }
                    }),
                    Function.createDelegate(this, function (sender, args) {
                        showErrorMessage(spContext, args.get_message());
                    }));
            }
            else {
                if (typeof (callback) == "function") {
                    callback(myLikesItems.get_count(), authors);
                }
            }
        }),
        Function.createDelegate(this, function (sender, args) {
            showErrorMessage(spContext, args.get_message());
        }));
}

function removeLike(spContext, newsId, collectionPosition, callback) {
    var queryXml = "<View>" +
                       "<Query>" +
                           "<Where>" +
                               "<And>" +
                                    "<Eq>" +
                                        "<FieldRef Name='LikesItemNews' LookupId='TRUE' />" +
                                        "<Value Type='Lookup'>" + newsId + "</Value>" +
                                    "</Eq>" +
                                    "<Eq>" +
                                        "<FieldRef Name='Author' LookupId='TRUE' />" +
                                        "<Value Type='Lookup'><UserID /></Value>" +
                                    "</Eq>" +
                                "</And>" +
                           "</Where>" +
                       "</Query>" +
                       "<RowLimit>100</RowLimit>" +
                   "</View>";

    var query = new SP.CamlQuery();
    query.set_viewXml(queryXml);
    query.set_listItemCollectionPosition(collectionPosition);

    var likesItems = _likesList.getItems(query);
    spContext.load(likesItems);

    spContext.executeQueryAsync(
        Function.createDelegate(this, function () {
            if (likesItems.get_count() > 0) {
                var likesItemsArray = [];

                var enumerator = likesItems.getEnumerator();
                while (enumerator.moveNext()) {
                    likesItemsArray.push(enumerator.get_current());
                }

                for (var i = likesItemsArray.length - 1; i > -1; i--) {
                    likesItemsArray[i].deleteObject();
                }

                spContext.executeQueryAsync(
                    Function.createDelegate(this, function () {
                        if (likesItems.get_listItemCollectionPosition() != null) {
                            removeLike(spContext, newsId, likesItems.get_listItemCollectionPosition(), callback);
                        }
                        else {
                            if (typeof (callback) == "function") {
                                callback();
                            }
                        }
                    }),
                    Function.createDelegate(this, function (sender, args) {
                        showErrorMessage(spContext, args.get_message());
                    }));
            }
            else {
                if (typeof (callback) == "function") {
                    callback();
                }
            }
        }),
        Function.createDelegate(this, function (sender, args) {
            showErrorMessage(spContext, args.get_message());
        }));
}

function addLike(spContext, newsId, callback) {
    removeLike(spContext, newsId, null, function () {
        var listItemInformation = new SP.ListItemCreationInformation();
        var listItem = _likesList.addItem(listItemInformation);

        var newsIdValue = new SP.FieldLookupValue();
        newsIdValue.set_lookupId(newsId);

        listItem.set_item("LikesItemNews", newsIdValue);
        listItem.update();

        spContext.load(listItem);
        spContext.executeQueryAsync(
            Function.createDelegate(this, function () {
                if (typeof (callback) == "function") {
                    callback();
                }
            }),
            Function.createDelegate(this, function (sender, args) {
                showErrorMessage(spContext, args.get_message());
            }));
    });
}

function addLikesCallout(likeButton, newsId, authors) {
    var authorsStr = "";
    var authorsCounter = 1;

    for (var i in authors) {
        var author = authors[i];

        if (authorsStr.length > 0) {
            authorsStr += ", ";
        }

        authorsStr += author.get_item("Author");

        if (authorsCounter == 5) {
            authorsStr += "<span class='ms-soften'>" + resources.getLikesHiddenText(authors.length - authorsCounter) + "</span>";

            break;
        }

        authorsCounter++;
    }

    var calloutSection = CalloutManager.createNew({
        ID: newsId,
        content: "<div class='ms-vl-calloutversion'><div class='ms-vl-calloutContent' style='max-height: 60px; overflow-y: auto'>" + authorsStr + "</div></div>",
        launchPoint: likeButton
    });
}

function addCommentsSection(spContext, footerDiv, newsValue, callback) {
    var queryXml = "<View>" +
                       "<Query>" +
                           "<Where>" +
                               "<Eq>" +
                                   "<FieldRef Name='CommentsItemNews' LookupId='TRUE' />" +
                                   "<Value Type='Lookup'>" + newsValue.id + "</Value>" +
                               "</Eq>" +
                           "</Where>" +
                       "</Query>" +
                       "<RowLimit>106</RowLimit>" +
                   "</View>";

    var query = new SP.CamlQuery();
    query.set_viewXml(queryXml);

    var commentsItems = _commentsList.getItems(query);
    spContext.load(commentsItems);

    spContext.executeQueryAsync(
        Function.createDelegate(this, function () {
            if (commentsItems.get_count() > 0) {
                if (newsValue.allowLikes) {
                    $(footerDiv).append("<span class='commentsCountSpan ms-soften'>" + resources.getCommentsCountText(commentsItems.get_count()) + "</span>");
                }
                else {
                    $(footerDiv).append("<span class='commentsCountSpanAfterLikes ms-soften'>" + resources.getCommentsCountText(commentsItems.get_count()) + "</span>");
                }
            }

            if (typeof (callback) == "function") {
                callback();
            }
        }),
        Function.createDelegate(this, function (sender, args) {
            showErrorMessage(spContext, args.get_message());
        }));
}

function showErrorMessage(spContext, message) {
    var $contentDiv = $("#contentDiv");

    $contentDiv.html("");
    $contentDiv.hide();

    $("#errorMessageTextDiv").html(message);
    $("#errorMessageDiv").show();

    resizeWebPart();

    SP.Utilities.Utility.logCustomAppError(spContext, message);
    spContext.executeQueryAsync(Function.createDelegate(this, function () { }), Function.createDelegate(this, function (sender, args) { }));
}

function onPreScriptsLoaded() {
    loadDefaultStyles(function () {
        var $formDiv = $("#formDiv");
        $formDiv.show();

        if (self == top) {
            $formDiv.attr("page_content", "true");
        }
        else {
            $formDiv.attr("page_content", "false");
        }
    });

    document.title = resources.get_pageTitle();

    $("#errorMessageHeaderH1").html(resources.get_errorMessageHeaderTitle());
    $("#reloadLink").html(resources.get_reloadLinkTitle());
}

function onPostScriptsLoaded() {
    var spContext = SP.ClientContext.get_current();

    var spLists = spContext.get_web().get_lists();
    spContext.load(spLists, "Include(DefaultViewUrl)");

    spContext.executeQueryAsync(
        Function.createDelegate(this, function () {
            _newsList = getList(spLists, "/LISTS/NEWS/");
            if (_newsList == null) {
                showErrorMessage(spContext, resources.get_noNewsListErrorText());

                return;
            }

            _likesList = getList(spLists, "/LISTS/LIKES/");
            if (_likesList == null) {
                showErrorMessage(spContext, resources.get_noLikesListErrorText());

                return;
            }

            _commentsList = getList(spLists, "/LISTS/COMMENTS/");
            if (_commentsList == null) {
                showErrorMessage(spContext, resources.get_noCommentsListErrorText());

                return;
            }

            var itemsLimit = parseInt(getQueryStringParam("ItemsLimit"), 10);
            if (!isNaN(itemsLimit) && itemsLimit > 0) {
                _pageSize = itemsLimit;
            }

            showNews(spContext, null);
        }),
        Function.createDelegate(this, function (sender, args) {
            showErrorMessage(spContext, args.get_message());
        }));
}

function reloadLink_Click(reloadLink) {
    document.location.reload();
}