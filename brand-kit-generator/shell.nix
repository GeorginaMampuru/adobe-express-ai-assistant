

with import <nixpkgs> {};

let
  pythonEnv = python3.withPackages (ps: [ ps.opencv4 ps.numpy ]);
in
  mkShell {
    buildInputs = [ pythonEnv python3 ];

    shellHook = ''
      export PYTHON_PATH="${pythonEnv}/bin/python";
      export -p
    '';
  }


