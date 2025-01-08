document.addEventListener("DOMContentLoaded", async function () {
  const apiUrl =
    "https://api.easy-orders.net/api/v1/categories?filter=parent_id||isnull&filter=hidden||eq||false&limit=50&sort=position,DESC";

  async function fetchCategories() {
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-encoding": "gzip, deflate, br, zstd",
          "accept-language": "en-US,en;q=0.9,ar;q=0.8",
          "cache-control": "no-cache",
          origin: "https://arkanislamic.myeasyorders.com",
          referer: "https://arkanislamic.myeasyorders.com/",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      // console.log("Fetched categories:", data);
      return data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  // Organize categories into a hierarchy
  function organizeCategories(categories) {
    const categoryMap = new Map();

    // Create a map of all categories
    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        level: 0,
      });
    });

    const rootCategories = [];
    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id);
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          category.level = parent.level + 1;
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    // Flatten hierarchy into a sorted array
    // Modified flattenCategories to only return root level items
    function flattenCategories(categories, result = []) {
      categories.forEach((category) => {
        if (!category.parent_id) {
          result.push({
            name: category.name,
            slug: category.slug,
          });
        }
      });
      return result;
    }

    return flattenCategories(categories);
  }

  // Main function to fetch categories and replace the menu
  async function replaceMenu() {
    const categories = await fetchCategories();
    const organizedCategories = organizeCategories(categories);

    // Add a style element to override HR margins
    const style = document.createElement("style");
    style.textContent = `
        #headlessui-portal-root hr {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
      `;
    document.head.appendChild(style);

    // Create a mutation observer to watch for the menu element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const portalRoot = document.getElementById("headlessui-portal-root");
          if (portalRoot) {
            const panels = portalRoot.querySelectorAll(
              '[id^="headlessui-tabs-panel"]'
            );
            panels.forEach((panel) => {
              if (panel.querySelector("img")) {
                // Clear and style panel
                panel.innerHTML = "";
                panel.className = "space-y-5 px-4 pt-8 pb-8";

                // Add categories
                organizedCategories.forEach((cat) => {
                  const categoryDiv = document.createElement("div");

                  const innerDiv = document.createElement("div");
                  innerDiv.className = "flex items-center justify-between";

                  const categoryName = document.createElement("p");
                  categoryName.className = "font-bold text-lg";
                  categoryName.textContent = cat.name;

                  const svg = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg"
                  );
                  svg.setAttribute("stroke", "currentColor");
                  svg.setAttribute("fill", "currentColor");
                  svg.setAttribute("stroke-width", "0");
                  svg.setAttribute("viewBox", "0 0 24 24");
                  svg.setAttribute(
                    "class",
                    "inline-block ms-1 transition-all duration-200 ease-in-out w-5 h-5 group-hover:w-6"
                  );
                  svg.setAttribute("height", "1em");
                  svg.setAttribute("width", "1em");

                  const path = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                  );
                  path.setAttribute(
                    "d",
                    "M10.78 19.03a.75.75 0 0 1-1.06 0l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L5.81 11.5h14.44a.75.75 0 0 1 0 1.5H5.81l4.97 4.97a.75.75 0 0 1 0 1.06Z"
                  );

                  svg.appendChild(path);
                  innerDiv.appendChild(categoryName);
                  innerDiv.appendChild(svg);

                  const link = document.createElement("a");
                  link.href = `/collections/${cat.slug}`;
                  link.appendChild(innerDiv);

                  categoryDiv.appendChild(link);
                  panel.appendChild(categoryDiv);
                });
              }
            });
          }
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Call the main function
  replaceMenu();
});
