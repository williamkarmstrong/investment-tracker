document.getElementsByName("assetType").forEach(type => {
    type.addEventListener('change', () => {
        document.getElementById("otherPrice").hidden = type.value !== "Other";
    })
});