
  document.addEventListener("DOMContentLoaded", async function () {
    const apiUrl = "https://api.easy-orders.net/api/v1/categories";

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
      function flattenCategories(categories, result = []) {
        categories.forEach((category) => {
          result.push({
            name: category.name,
            slug: category.slug,
            level: category.level,
          });
          if (category.children.length > 0) {
            flattenCategories(category.children, result);
          }
        });
        return result;
      }

      return flattenCategories(rootCategories);
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
            const portalRoot = document.getElementById(
              "headlessui-portal-root"
            );
            if (portalRoot) {
              const panels = portalRoot.querySelectorAll(
                '[id^="headlessui-tabs-panel"]'
              );
              panels.forEach((panel) => {
                if (panel.querySelector("img")) {
                  // Clear existing content
                  panel.innerHTML = "";
                  panel.style.paddingTop = "0.4rem";
                  panel.style.paddingBottom = "0.4rem";

                  // Add categories
                  organizedCategories.forEach((cat, index) => {
                    // Create link element
                    const link = document.createElement("a");
                    link.href = `/collections/${cat.slug}`;

                    // Create category name element
                    const categoryName = document.createElement("p");
                    categoryName.className = "font-bold my-4";

                    // Add indentation based on level
                    categoryName.style.marginRight = `${cat.level * 20}px`;
                    categoryName.textContent = cat.name;

                    // Append '◄' to the end of the category name
                    categoryName.textContent += " ◄";

                    // Add category name to link
                    link.appendChild(categoryName);

                    // Add link to panel
                    panel.appendChild(link);

                    // Add separator if not the last item
                    if (index < organizedCategories.length - 1) {
                      const separator = document.createElement("hr");
                      separator.className = "border-gray-200";
                      panel.appendChild(separator);
                    }
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

