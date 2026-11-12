# GPU Flow Explorer

An interactive, browser-based explainer for GPU data movement, compute architecture and multithreaded execution across **AMD, NVIDIA and Intel**.

**Live site:** Enable GitHub Pages from the `gh-pages` deployment workflow after pushing this repository.

## What is included

- Vendor and architecture-family selector
- Conceptual hardware data path: host → device memory → compute array → execution groups → output
- Clickable architecture blocks with explanations
- Adjustable multithreaded scheduling simulation
- Illustrative memory-latency waits and latency hiding
- Cross-vendor terminology comparison
- Responsive static site; no build step or runtime dependencies
- GitHub Actions workflow to publish the site to GitHub Pages

## Run locally

No package manager or build process is required.

```bash
git clone https://github.com/YOUR-USERNAME/gpu-flow-explorer.git
cd gpu-flow-explorer
```

Open `index.html` in a browser, or run a local static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a GitHub repository named `gpu-flow-explorer`.
2. Push the contents of this folder to the `main` branch.
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions** if it is not already selected.
4. The workflow in `.github/workflows/pages.yml` deploys the static site.
5. The published URL will be `https://YOUR-USERNAME.github.io/gpu-flow-explorer/`.

## Accuracy and scope

This project is an **educational conceptual model**, not a die-level reverse-engineering project and not a hardware telemetry dashboard.

- Internal block names, execution-group widths, cache structures and capabilities vary by product generation.
- The scheduler visualisation is a simplified teaching simulation. It does not model a vendor's proprietary hardware scheduler, exact occupancy rules, instruction issue rate or cycle-accurate timing.
- Do not interpret the architecture cards as a specification for every GPU in a vendor family.
- Future live telemetry can be added through a local companion agent using supported APIs (for example, ROCm SMI, NVIDIA NVML / Nsight tooling, or Intel telemetry interfaces). A static GitHub Pages site cannot directly inspect arbitrary local GPU hardware.

## Documentation

- [NVIDIA CUDA C++ Programming Guide](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)
- [AMD ROCm documentation](https://rocm.docs.amd.com/)
- [AMD HIP programming model](https://rocm.docs.amd.com/projects/HIP/en/latest/)
- [Intel oneAPI](https://www.intel.com/content/www/us/en/developer/tools/oneapi/overview.html)

## Inspiration

The interaction pattern is inspired by educational explainers such as [Transformer Explainer](https://poloclub.github.io/transformer-explainer/). This project is independently implemented and does not reuse its source code or branding.

## License

MIT. See [LICENSE](LICENSE).
