


function parseTitle(name) {
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/\bi\b/g, 'I')
        .replace(/\bIi\b/g, 'II')
        .replace(/\bIii\b/g, 'III')
        .replace(/\bIv\b/g, 'IV')
        .replace(/\bVi\b/g, 'VI')
        .replace(/\bVii\b/g, 'VII')
        .replace(/\bDe\b/g, 'de')
        .replace(/\bDo\b/g, 'do')
        .replace(/\bA\b/g, 'a')
        .replace(/\bAo\b/g, 'ao')
        .replace(/\bDa\b/g, 'da')
        .replace(/\bDos\b/g, 'dos')
        .replace(/\bDas\b/g, 'das')
        .replace(/\bE\b/g, 'e')
        .replace(/\bEm\b/g, 'em')
        .replace(/\bNa\b/g, 'na')
        .replace(/\bNas\b/g, 'nas')
        .replace(/\bNo\b/g, 'no')
        .replace(/\bNos\b/g, 'nos')
        .replace(/\bCom\b/g, 'com')
        .replace(/\bSem\b/g, 'sem')
        .replace(/\bSob\b/g, 'sob')
        .replace(/\bPela\b/g, 'pela')
        .replace(/\bPelas\b/g, 'pelas')
        .replace(/\bPelo\b/g, 'pelo')
        .replace(/\bPela\b/g, 'pela')
        .replace(/\bPelas\b/g, 'pelas')
        .replace(/\bÀ\b/g, 'à')
        .replace(/\bÀs\b/g, 'às');
}