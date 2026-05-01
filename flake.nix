{
  description = "oheya";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    inputs:
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = inputs.nixpkgs.legacyPackages.${system};

        # fetchurl (not fetchFromGitHub) because the npm tarball ships pre-built dist/
        # and native NAPI binaries as optionalDependencies. Building from the GitHub
        # source would require Rust + napi-rs compilation.
        vite-plus =
          let
            version = "0.1.20";

            src = pkgs.fetchurl {
              url = "https://registry.npmjs.org/vite-plus/-/vite-plus-${version}.tgz";
              hash = "sha256-sIQWJmClPT+noDGtceZENSpY7QqqHRxEKDG/61XoEuA=";
            };

            # This is a fixed-output derivation: a derivation that is allowed to access
            # the network during the build because its output hash is declared in advance.
            # Nix normally isolates builds from the network to guarantee reproducibility,
            # but fixed-output derivations opt out of that restriction by promising
            # "the output will always hash to this value". After the build, Nix verifies
            # the actual output hash matches the declared one; a mismatch is a build error.
            # fetchurl and fetchFromGitHub use the exact same mechanism internally.
            #
            # Purpose: the npm tarball lacks package-lock.json (required by buildNpmPackage)
            # and its package.json contains private unpublished devDependencies that cause
            # `npm install` to fail. This derivation strips those devDependencies and
            # generates a clean package-lock.json via the network.
            #
            # To update (e.g. on a version bump):
            #   1. Set outputHash = pkgs.lib.fakeHash
            #   2. Run `nix develop` — Nix will fail and print the actual hash
            #   3. Replace outputHash with the printed value
            prepared = pkgs.stdenv.mkDerivation {
              name = "vite-plus-${version}-prepared";
              inherit src;
              sourceRoot = "package";

              nativeBuildInputs = with pkgs; [
                nodejs
                cacert
              ];

              # The Nix sandbox has no system SSL certificates, so npm's HTTPS connections
              # to the registry would fail certificate verification. NODE_EXTRA_CA_CERTS
              # points Node.js to the CA bundle provided by pkgs.cacert.
              NODE_EXTRA_CA_CERTS = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";

              buildPhase = ''
                # The Nix sandbox sets HOME to /homeless-shelter, a non-writable dummy
                # directory. npm tries to write its cache to ~/.npm, so we redirect HOME
                # to $TMPDIR which is always writable inside the build environment.
                export HOME="$TMPDIR"

                # The published package.json contains devDependencies that reference
                # private monorepo-internal packages (e.g. @voidzero-dev/vite-plus-prompts@0.0.0)
                # which are not published to npm. Attempting to resolve them would fail,
                # so we remove devDependencies and scripts before generating the lock file.
                node -e "
                  const fs = require('fs');
                  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                  delete pkg.devDependencies;
                  delete pkg.scripts;
                  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
                "

                # Generate package-lock.json without actually installing anything.
                # buildNpmPackage requires a lock file to reproduce the dependency tree.
                npm install --package-lock-only --ignore-scripts --audit=false --fund=false
              '';

              installPhase = ''
                # All derivation outputs must be placed under $out.
                # buildNpmPackage's postPatch will copy these two files into the source tree.
                mkdir $out
                cp package.json      $out/
                cp package-lock.json $out/
              '';

              # "recursive" hashes the entire $out directory (as a NAR archive),
              # as opposed to "flat" which hashes a single file. We use "recursive"
              # because installPhase writes multiple files into a directory.
              outputHashMode = "recursive";
              outputHashAlgo = "sha256";
              outputHash = "sha256-r+JSbywCN1mtI1KfHXxi0d57aNsi0HW9zCdO1Y+gIAQ=";
            };
          in
          pkgs.buildNpmPackage {
            pname = "vite-plus";
            inherit version src;
            sourceRoot = "package";
            nodejs = pkgs.nodejs;
            postPatch = ''
              cp ${prepared}/package.json      package.json
              cp ${prepared}/package-lock.json package-lock.json
            '';
            npmDepsHash = "sha256-oBjJF5FQCebsvKi76YcSlsUJWTT7G5xM4jspu+aIKdE=";
            dontNpmBuild = true; # dist/ is pre-built in the npm tarball
          };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            corepack
            vite-plus
            cacert
          ];
          
          shellHook = ''
            export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
            export NODE_EXTRA_CA_CERTS=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
          '';
        };
      }
    );
}
