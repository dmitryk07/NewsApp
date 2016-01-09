var resources = {
    get_pageTitle: function () { return "News"; },

    get_removeLikeButtonImgAlt: function () { return "I don't like it"; },
    get_removeLikeButtonSpanTitle: function () { return "I don't like it"; },

    get_addLikeButtonImgAlt: function () { return "I like it"; },
    get_addLikeButtonSpanTitle: function () { return "I like it"; },

    get_nextButtonImgAlt: function () { return "Next"; },
    get_nextButtonTitle: function () { return "Next"; },

    get_previousButtonImgAlt: function () { return "Previous"; },
    get_previousButtonTitle: function () { return "Previous"; },

    get_noNewsListErrorText: function () { return "News list does not exist or you do not have permission to perform this operation."; },

    get_errorMessageHeaderTitle: function () { return "Sorry, something went wrong"; },
    get_reloadLinkTitle: function () { return "TRY AGAIN"; },

    getLikesCountPrefixText: function (likesCount) {
        if (likesCount <= 0) {
            return "";
        }
        else if (likesCount == 1) {
            return "User likes this news: ";
        }
        else if (likesCount <= 100) {
            return "Users like this news (" + likesCount + "): ";
        }
        else {
            return "Users like this news (100+): ";
        }
    },

    getCommentsSectionText: function (commentsCount) {
        if (commentsCount == 1) {
            return "Comments:";
        }
        else {
            return "Comments (" + commentsCount + "):";
        }
    }
};