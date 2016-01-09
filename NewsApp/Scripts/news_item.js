var _commentsPageIndex = 0;
var _commentsPageSize = 100;

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

function loadDefaultStyles(callback) {
    var webUrl = "";
    var webUrlPosition = document.URL.toUpperCase().indexOf("/NEWSAPP/PAGES/NEWSITEM.ASPX");

    if (webUrlPosition > -1) {
        webUrl = document.URL.substring(0, webUrlPosition);
    }

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

function showErrorMessage(spContext, message) {
    var $contentDiv = $("#contentDiv");

    $contentDiv.html("");
    $contentDiv.hide();

    $("#errorMessageTextDiv").html(message);
    $("#errorMessageDiv").show();

    SP.Utilities.Utility.logCustomAppError(spContext, message);
    spContext.executeQueryAsync(Function.createDelegate(this, function () { }), Function.createDelegate(this, function (sender, args) { }));
}

function onPreScriptsLoaded() {
    loadDefaultStyles(function () {
        $("#formDiv").show();
    });

    document.title = resources.get_pageTitle();

    $("#errorMessageHeaderH1").html(resources.get_errorMessageHeaderTitle());
    $("#reloadLink").html(resources.get_reloadLinkTitle());
}

function onPostScriptsLoaded() {
    var spContext = SP.ClientContext.get_current();

    var newsId = parseInt(getQueryStringParam("ID"), 10);
    if (isNaN(newsId)) {
        return;
    }

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

            var newsItem = _newsList.getItemById(newsId);
            spContext.load(newsItem, "Id", "Title", "NewsItemMainContent", "NewsItemAllowLikes", "NewsItemAllowComments");

            var newsItemHtml = newsItem.get_fieldValuesAsHtml();
            spContext.load(newsItemHtml, "Created");

            spContext.executeQueryAsync(
                Function.createDelegate(this, function () {
                    document.title = newsItem.get_item("Title");

                    var $contentDiv = $("#contentDiv");
                    $contentDiv.append("<h1>" + newsItem.get_item("Title") + "</h1>");
                    $contentDiv.append("<div class='ms-descriptiontext' noWrap='nowrap'>" + newsItemHtml.get_item("Created") + "</div>");
                    $contentDiv.append("<div>" + newsItem.get_item("NewsItemMainContent") + "</div>");

                    if (newsItem.get_item("NewsItemAllowLikes") || newsItem.get_item("NewsItemAllowComments")) {
                        var $footerDiv = $("<div class='newsFooter'></div>");
                        $contentDiv.append($footerDiv);

                        if (newsItem.get_item("NewsItemAllowLikes")) {
                            var $likesSectionDiv = $("<div id='likesSectionDiv'></div>");
                            $footerDiv.append($likesSectionDiv);

                            addLikesSection(spContext, $likesSectionDiv[0], newsItem.get_id());
                        }

                        if (newsItem.get_item("NewsItemAllowComments")) {
                            if (newsItem.get_item("NewsItemAllowLikes")) {
                                $footerDiv.append("<div class='sectionTopSeparator'></div>");
                                $footerDiv.append("<div class='sectionTopSeparator'></div>");
                            }

                            var $commentsSectionDiv = $("<div id='commentsSectionDiv'></div>");
                            $footerDiv.append($commentsSectionDiv);

                            addCommentsSection(spContext, $commentsSectionDiv, newsItem.get_id(), null);
                        }
                    }
                }),
                Function.createDelegate(this, function (sender, args) {
                    showErrorMessage(spContext, args.get_message());
                }));
        }),
        Function.createDelegate(this, function (sender, args) {
            showErrorMessage(spContext, args.get_message());
        }));
}

function addLikesSection(spContext, likesSectionDiv, newsId) {
    loadLikesItems(spContext, newsId, function (myLikesItemsCount, authors) {
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

                    removeLike(spContext, newsId, null, function () {
                        addLikesSection(spContext, likesSectionDiv, newsId);
                    });
                }
                else {
                    $likeButtonImg.attr("src", "../Images/AddLikeDisabledIcon.png");

                    addLike(spContext, newsId, function () {
                        addLikesSection(spContext, likesSectionDiv, newsId);
                    });
                }
            }
        });

        $(likesSectionDiv).find(".likeButtonSpan:first").remove();
        $(likesSectionDiv).prepend($likeButtonSpan);

        if (authors.length > 0) {
            var authorsStr = "";
            var authorsCounter = 1;

            for (var i in authors) {
                var author = authors[i];

                if (authorsStr.length > 0) {
                    authorsStr += "<span>, </span>";
                }

                authorsStr += author.get_item("Author");

                if (authorsCounter == 1000) {
                    authorsStr += "...";

                    break;
                }

                if (i == authors.length - 1) {
                    authorsStr += ".";

                    break;
                }

                authorsCounter++;
            }

            var $likesSpan = $("<span class='likesSpan'></span>");
            $likesSpan.html("<span>" + resources.getLikesCountPrefixText(authors.length) + "</span>" + authorsStr);

            $(likesSectionDiv).find(".likesSpan:first").remove();
            $likeButtonSpan.after($likesSpan);
        }
        else {
            $(likesSectionDiv).find(".likesSpan:first").remove();
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
                        "<RowLimit>1001</RowLimit>" +
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
                       "<RowLimit>1000</RowLimit>" +
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
//
function addCommentsSection(spContext, commentsSectionDiv, newsId, collectionPosition) {
    $(commentsSectionDiv).html("");

    var queryXml = "<View>" +
                       "<Query>" +
                           "<Where>" +
                               "<Eq>" +
                                   "<FieldRef Name='CommentsItemNews' LookupId='TRUE' />" +
                                   "<Value Type='Lookup'>" + newsId + "</Value>" +
                               "</Eq>" +
                           "</Where>" +
                       "</Query>" +
                       "<ViewFields>" +
                           "<FieldRef Name='CommentsItemComment' />" +
                           "<FieldRef Name='Author' />" +
                           "<FieldRef Name='Created' />" +
                       "</ViewFields>" +
                       "<RowLimit>" + _commentsPageSize + "</RowLimit>" +
                   "</View>";

    var query = new SP.CamlQuery();
    query.set_viewXml(queryXml);
    query.set_listItemCollectionPosition(collectionPosition);

    var user = spContext.get_web().get_currentUser();
    spContext.load(user);

    var commentsItems = _commentsList.getItems(query);
    spContext.load(commentsItems);

    spContext.executeQueryAsync(
        Function.createDelegate(this, function () {
            var commentsValues = [];

            var enumerator = commentsItems.getEnumerator();
            while (enumerator.moveNext()) {
                var commentsItem = enumerator.get_current();

                var commentsValue = {
                    id: commentsItem.get_id(),
                    author: commentsItem.get_item("Author"),
                    comment: commentsItem.get_item("CommentsItemComment"),
                    htmlValues: commentsItem.get_fieldValuesAsHtml()
                };

                spContext.load(commentsValue.htmlValues, "Author", "Created");
                commentsValues.push(commentsValue);
            }

            if (commentsValues.length > 0) {
                spContext.executeQueryAsync(
                    Function.createDelegate(this, function () {
                        $(commentsSectionDiv).append("<div class='ms-webpart-titleText'>" + resources.getCommentsSectionText(commentsValues.length) + "</div>");
                        $(commentsSectionDiv).append("<hr class='sectionSeparator'></div>");

                        //---------------------------------------------------
                        for (var i in commentsValues) {
                            var commentValue = commentsValues[i];

                            var $commentTable = $("<table><tr><td class='commentInfo'></td><td class='commentData'></td></tr></table>");

                            var $commentInfoTd = $commentTable.find(".commentInfo:first");
                            $commentInfoTd.append("<div>" + commentValue.htmlValues.get_item("Author") + "</div>");
                            $commentInfoTd.append("<div class='ms-descriptiontext'>" + commentValue.htmlValues.get_item("Created") + "</div>");

                            var $commentDataTd = $commentTable.find(".commentData:first");
                            $commentTable.find(".commentData:first").append("<div class='commentDataSection' style='color: black'><span>" + commentValue.comment + "</span></div>");

                            if (commentValue.author.get_lookupId() == user.get_id()) {
                                var $removeCommentButton = $("<a class='ms-accentText' href='javascript:;'>Удалить" + "</a>");
                                $removeCommentButton.click(function () {
                                    removeComment(spContext, commentValue.id, null);
                                });

                                $commentDataTd.append($removeCommentButton);
                            }

                            if (i != 0) {
                                $(commentsSectionDiv).append("<div class='sectionTopSeparator'></div>");
                            }

                            $(commentsSectionDiv).append($commentTable);
                        }
                        //---------------------------------------------------

                        $(commentsSectionDiv).append("<hr class='sectionSeparator'></div>");

                        addPaging(spContext, commentsSectionDiv, newsId, commentsItems.get_listItemCollectionPosition(), commentsValues[0].id, commentsValues.length);
                    }),
                    Function.createDelegate(this, function (sender, args) {
                        showErrorMessage(spContext, args.get_message());
                    }));
            }
        }),
        Function.createDelegate(this, function (sender, args) {
            showErrorMessage(spContext, args.get_message());
        }));
}

function addPaging(spContext, commentsSectionDiv, newsId, collectionPosition, firstId, itemsCount) {
    var $previousButton;
    if (_commentsPageIndex > 0) {
        var previousCollectionPosition = new SP.ListItemCollectionPosition();
        previousCollectionPosition.set_pagingInfo("PagedPrev=TRUE&Paged=TRUE&p_ID=" + firstId);

        var $previousButtonImg = $("<img class='ms-promlink-button-left' border='0' src='/_layouts/15/images/spcommon.png?rev=39' />");
        $previousButtonImg.attr("alt", resources.get_previousButtonImgAlt());

        var $previousButtonSpan = $("<span class='ms-promlink-button-image'></span>");
        $previousButtonSpan.append($previousButtonImg);

        $previousButton = $("<a class='ms-commandLink ms-promlink-button ms-promlink-button-enabled' href='javascript:'></a>");
        $previousButton.attr("title", resources.get_previousButtonTitle());
        $previousButton.append($previousButtonSpan);

        $previousButton.click(function () {
            _commentsPageIndex--;

            addCommentsSection(spContext, commentsSectionDiv, newsId, previousCollectionPosition);
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
            _commentsPageIndex++;

            addCommentsSection(spContext, commentsSectionDiv, newsId, collectionPosition);
        });
    }

    if (typeof ($previousButton) != "undefined" || typeof ($nextButton) != "undefined") {
        var $pagingTable = $("<table cellspacing='0' cellpadding='0'><tr><td></td><td></td><td></td></tr</table>");

        if (typeof ($previousButton) != "undefined") {
            $pagingTable.find("td:eq(0)").append($previousButton);
        }

        $pagingTable.find("td:eq(1)").append("<div class='ms-paging'>" + (_commentsPageIndex * _commentsPageSize + 1) + " - " + (_commentsPageIndex * _commentsPageSize + itemsCount) + "</div>");

        if (typeof ($nextButton) != "undefined") {
            $pagingTable.find("td:eq(2)").append($nextButton);
        }

        $(commentsSectionDiv).append($pagingTable);
    }
}
//
function removeComment(spContext, commentId, callback) {

}

function reloadLink_Click(reloadLink) {
    document.location.reload();
}

//1. Add comment
//2. Remove comment
//3. Likes section wrapping