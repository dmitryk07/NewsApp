var resources = {
    get_pageTitle: function () { return "News"; },

    get_loadingHeaderText: function () { return "Loading..."; },

    get_removeLikeButtonImgAlt: function () { return "I don't like it"; },
    get_removeLikeButtonSpanTitle: function () { return "I don't like it"; },

    get_addLikeButtonImgAlt: function () { return "I like it"; },
    get_addLikeButtonSpanTitle: function () { return "I like it"; },

    get_nextButtonImgAlt: function () { return "Next"; },
    get_nextButtonTitle: function () { return "Next"; },

    get_previousButtonImgAlt: function () { return "Previous"; },
    get_previousButtonTitle: function () { return "Previous"; },

    get_noNewsListErrorText: function () { return "News list does not exist or you do not have permission to perform this operation."; },
    get_noLikesListErrorText: function () { return "Likes list does not exist or you do not have permission to perform this operation."; },
    get_noCommentsListErrorText: function () { return "Comments list does not exist or you do not have permission to perform this operation."; },

    get_errorMessageHeaderTitle: function () { return "Sorry, something went wrong"; },
    get_reloadLinkTitle: function () { return "TRY AGAIN"; },

    getLikesCountText: function (likesCount) {
        if (likesCount <= 0) {
            return "";
        }
        else if (likesCount == 1) {
            return "1 user likes this news";
        }
        else if (likesCount <= 100) {
            return likesCount + " users like this news";
        }
        else {
            return "100+ users like this news";
        }
    },

    getCommentsCountText: function (commentsCount) {
        if (commentsCount <= 0) {
            return "";
        }
        else if (commentsCount == 1) {
            return "1 comment";
        }
        else if (commentsCount <= 100) {
            return commentsCount + " comments";
        }
        else {
            return "100+ comments";
        }
    },

    getLikesHiddenText: function (likesCount) {
        if (likesCount <= 0) {
            return ".";
        }
        else if (likesCount == 1) {
            return " and another 1 user.";
        }
        else if (likesCount <= 100) {
            return " and another " + likesCount + " users.";
        }
        else {
            return " and another 100+ users.";
        }
    }
};