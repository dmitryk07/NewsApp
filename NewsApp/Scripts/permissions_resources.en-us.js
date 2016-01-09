var resources = {
    get_pageTitle: function () { return "Manage permissions"; },

    get_pickerSections: function () {
        return [
            { key: "AppReaders", header: "Readers", description: "Readers have access to reading news, adding Like marks and comments." },
            { key: "AppContributors", header: "Contributors", description: "Contributors have edit access to the app content." },
            { key: "AppOwners", header: "Owners", description: "Owners have full access to the app content." }
        ];
    },

    get_webPermissions: function () {
        return [
            { key: "AppReaders", roleType: SP.RoleType.reader },
            { key: "AppContributors", roleType: SP.RoleType.contributor },
            { key: "AppOwners", roleType: SP.RoleType.administrator }
        ]
    },

    get_listsPermissions: function () {
        return [
            {
                url: "/Lists/News/",
                permissions: [
                    { key: "AppReaders", roleType: SP.RoleType.reader },
                    { key: "AppContributors", roleType: SP.RoleType.contributor },
                    { key: "AppOwners", roleType: SP.RoleType.administrator }
                ]
            },
            {
                url: "/Lists/Assets/",
                permissions: [
                    { key: "AppReaders", roleType: SP.RoleType.reader },
                    { key: "AppContributors", roleType: SP.RoleType.contributor },
                    { key: "AppOwners", roleType: SP.RoleType.administrator }]
            },
            {
                url: "/Lists/Likes/",
                permissions: [
                    { key: "AppReaders", roleType: SP.RoleType.contributor },
                    { key: "AppContributors", roleType: SP.RoleType.contributor },
                    { key: "AppOwners", roleType: SP.RoleType.administrator }]
            },
            {
                url: "/Lists/Comments/",
                permissions: [
                    { key: "AppReaders", roleType: SP.RoleType.contributor },
                    { key: "AppContributors", roleType: SP.RoleType.contributor },
                    { key: "AppOwners", roleType: SP.RoleType.administrator }]
            }
        ];
    },

    get_okButtonText: function () { return "OK"; },
    get_cancelButtonText: function () { return "Cancel"; }
};